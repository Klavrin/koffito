from __future__ import annotations

from app.jobs.embeddings import EMBEDDING_DIMS, cosine_distance, parse_vector, survey_embedding
from app.jobs.matchmaking import Member, build_groups


def test_embedding_is_deterministic_and_normalised():
    answers = {"hobbies": ["hiking", "arts"], "topics": ["traveling"]}
    a = survey_embedding(answers)
    b = survey_embedding({"topics": ["traveling"], "hobbies": ["arts", "hiking"]})
    assert a == b
    assert len(a) == EMBEDDING_DIMS
    assert abs(sum(x * x for x in a) - 1) < 1e-9


def test_similar_surveys_are_closer():
    base = survey_embedding({"hobbies": ["hiking", "arts"], "topics": ["traveling"], "meetup": ["long"]})
    close = survey_embedding({"hobbies": ["hiking", "arts"], "topics": ["stories"], "meetup": ["long"]})
    far = survey_embedding({"hobbies": ["sports"], "topics": ["music"], "meetup": ["quick"]})
    assert cosine_distance(base, close) < cosine_distance(base, far)


def test_parse_vector_handles_pgvector_strings():
    assert parse_vector("[0.5, -1]") == [0.5, -1.0]
    assert parse_vector(None) is None
    assert parse_vector([1, 2]) == [1.0, 2.0]


def _member(user_id: str, answers: dict, languages: set[str] | None = None, joined: str = "1") -> Member:
    return Member(user_id, survey_embedding(answers), frozenset(languages or set()), joined)


def test_build_groups_prefers_similar_people_and_respects_size():
    hikers = {"hobbies": ["hiking", "travel"], "topics": ["traveling"]}
    gamers = {"hobbies": ["movies", "sports"], "topics": ["music"]}
    members = [
        _member("h1", hikers, joined="1"),
        _member("g1", gamers, joined="2"),
        _member("h2", hikers, joined="3"),
        _member("g2", gamers, joined="4"),
    ]
    groups = build_groups(members, size=2)
    formed = sorted(sorted(m.user_id for m in g.members) for g in groups)
    assert formed == [["g1", "g2"], ["h1", "h2"]]


def test_build_groups_keeps_a_shared_language():
    answers = {"hobbies": ["reading"]}
    members = [
        _member("ro-only", answers, {"ro"}, "1"),
        _member("en-only", answers, {"en"}, "2"),
        _member("ro-too", answers, {"ro", "en"}, "3"),
        _member("en-too", answers, {"en"}, "4"),
    ]
    groups = build_groups(members, size=2)
    for group in groups:
        spoken = [m.languages for m in group.members if m.languages]
        assert frozenset.intersection(*spoken)


def test_build_groups_folds_a_lonely_person_into_the_closest_group():
    answers = {"hobbies": ["reading"]}
    members = [_member(f"u{i}", answers, joined=str(i)) for i in range(5)]
    groups = build_groups(members, size=4)
    assert len(groups) == 1
    assert len(groups[0].members) == 5


def test_build_groups_needs_at_least_two_people():
    assert build_groups([_member("solo", {"hobbies": ["x"]})], size=4) == []
