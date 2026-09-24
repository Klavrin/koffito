from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str = Field(..., description="https://<ref>.supabase.co")
    supabase_anon_key: str = Field(..., description="Publishable / anon key sent as `apikey`.")
    supabase_service_role_key: str = Field("", description="Service role key, system jobs only.")
    supabase_jwt_secret: str = Field("", description="Legacy HS256 secret; empty when using asymmetric keys.")
    koffito_backend_key: str = Field(..., description="Unlocks the Data API for user-token requests.")

    app_env: Literal["development", "test", "production"] = "development"
    cors_origins: list[str] = Field(default_factory=list)
    rate_limit_default: str = "120/minute"
    jobs_enabled: bool = True
    match_lead_hours: float = 25
    log_level: str = "INFO"

    @field_validator("supabase_url")
    @classmethod
    def _strip_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def rest_url(self) -> str:
        return f"{self.supabase_url}/rest/v1"

    @property
    def jwks_url(self) -> str:
        return f"{self.supabase_url}/auth/v1/.well-known/jwks.json"

    @property
    def jwt_issuer(self) -> str:
        return f"{self.supabase_url}/auth/v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
