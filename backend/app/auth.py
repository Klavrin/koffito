"""Supabase JWT verification.

Every request is verified independently: signature (JWKS for ES256/RS256,
legacy shared secret for HS256), expiry, audience and issuer. Nothing is stored.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from .config import Settings, get_settings

log = logging.getLogger(__name__)

SUPPORTED_ASYMMETRIC = ("ES256", "RS256")
AUDIENCE = "authenticated"


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    role: str
    token: str
    claims: dict[str, Any]


class TokenVerifier:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._jwks: PyJWKClient | None = None

    def _jwks_client(self) -> PyJWKClient:
        if self._jwks is None:
            self._jwks = PyJWKClient(self._settings.jwks_url, cache_keys=True, lifespan=600)
        return self._jwks

    def verify(self, token: str) -> dict[str, Any]:
        try:
            header = jwt.get_unverified_header(token)
        except jwt.PyJWTError as exc:
            raise _unauthorized("Malformed token") from exc

        alg = header.get("alg")
        if alg in SUPPORTED_ASYMMETRIC:
            try:
                key = self._jwks_client().get_signing_key_from_jwt(token).key
            except jwt.PyJWTError as exc:
                raise _unauthorized("Unknown signing key") from exc
        elif alg == "HS256":
            if not self._settings.supabase_jwt_secret:
                raise _unauthorized("HS256 tokens are not accepted by this server")
            key = self._settings.supabase_jwt_secret
        else:
            raise _unauthorized("Unsupported token algorithm")

        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=[alg],
                audience=AUDIENCE,
                issuer=self._settings.jwt_issuer,
                options={"require": ["exp", "iat", "sub", "aud"]},
                leeway=10,
            )
        except jwt.ExpiredSignatureError as exc:
            raise _unauthorized("Token expired") from exc
        except jwt.PyJWTError as exc:
            raise _unauthorized("Invalid token") from exc

        if claims.get("role") != AUDIENCE:
            raise _unauthorized("Token is not a user session")
        return claims


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


_bearer = HTTPBearer(auto_error=False)


def get_verifier(request: Request) -> TokenVerifier:
    verifier: TokenVerifier | None = getattr(request.app.state, "verifier", None)
    if verifier is None:
        verifier = TokenVerifier(get_settings())
        request.app.state.verifier = verifier
    return verifier


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    verifier: Annotated[TokenVerifier, Depends(get_verifier)],
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Missing bearer token")
    claims = verifier.verify(credentials.credentials)
    # The user id always comes from the verified token, never from the body.
    return CurrentUser(
        id=str(claims["sub"]),
        email=claims.get("email"),
        role=str(claims.get("role")),
        token=credentials.credentials,
        claims=claims,
    )


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
