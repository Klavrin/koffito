"""Deterministic survey embeddings (feature hashing into 64 dims).

Good enough to group people with overlapping answers; swap for a model-based
embedding by bumping EMBEDDING_VERSION and changing `survey_embedding`.
"""

from __future__ import annotations

import hashlib
import math
from typing import Iterable

EMBEDDING_DIMS = 64
EMBEDDING_VERSION = 1

# Some questions say more about compatibility than others.
QUESTION_WEIGHTS = {
    "motivation": 1.0,
    "hobbies": 1.4,
    "topics": 1.4,
    "meetup": 0.8,
    "personality": 0.6,
}


def _bucket(token: str) -> tuple[int, float]:
    digest = hashlib.sha256(token.encode("utf-8")).digest()
    index = int.from_bytes(digest[:4], "big") % EMBEDDING_DIMS
    sign = 1.0 if digest[4] & 1 else -1.0
    return index, sign


def survey_embedding(answers: dict[str, list[str]]) -> list[float]:
    vector = [0.0] * EMBEDDING_DIMS
    for question, values in sorted(answers.items()):
        weight = QUESTION_WEIGHTS.get(question, 1.0)
        for value in values:
            index, sign = _bucket(f"{question}={value}")
            vector[index] += sign * weight
    norm = math.sqrt(sum(component * component for component in vector))
    if norm == 0:
        return vector
    return [component / norm for component in vector]


def cosine_distance(a: Iterable[float], b: Iterable[float]) -> float:
    a_list, b_list = list(a), list(b)
    dot = sum(x * y for x, y in zip(a_list, b_list))
    norm_a = math.sqrt(sum(x * x for x in a_list))
    norm_b = math.sqrt(sum(y * y for y in b_list))
    if norm_a == 0 or norm_b == 0:
        return 1.0
    return max(0.0, min(2.0, 1.0 - dot / (norm_a * norm_b)))


def parse_vector(value: object) -> list[float] | None:
    """PostgREST returns pgvector columns as a string like "[0.1,0.2]"."""
    if value is None:
        return None
    if isinstance(value, list):
        return [float(x) for x in value]
    if isinstance(value, str):
        stripped = value.strip("[] ")
        if not stripped:
            return None
        return [float(x) for x in stripped.split(",")]
    return None
