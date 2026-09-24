"""Request / response models. Everything the app sends is validated here."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

GenderLabel = Literal["Female", "Male", "Non-binary", "Prefer not to say"]
GENDER_TO_DB: dict[str, str] = {
    "Female": "female",
    "Male": "male",
    "Non-binary": "non_binary",
    "Prefer not to say": "prefer_not_to_say",
}
GENDER_FROM_DB: dict[str, str] = {value: key for key, value in GENDER_TO_DB.items()}

Language = Literal["ro", "ru", "en"]
ReportReason = Literal["no-show", "rude", "unsafe", "fake", "other"]
ReportStatus = Literal["open", "reviewing", "resolved"]
ConfirmStage = Literal["24h", "3h"]

SurveyAnswers = dict[str, list[str]]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ProfileUpdate(StrictModel):
    firstName: str | None = Field(None, min_length=1, max_length=60)
    avatar: str | None = Field(None, min_length=1, max_length=16)
    gender: GenderLabel | None = None
    age: int | None = Field(None, ge=18, le=120)
    occupation: str | None = Field(None, min_length=1, max_length=80)
    favoriteCoffee: str | None = Field(None, min_length=1, max_length=40)
    languages: list[Language] | None = Field(None, max_length=3)

    def to_profile_row(self, today: date) -> dict[str, Any]:
        row: dict[str, Any] = {}
        if self.firstName is not None:
            row["display_name"] = self.firstName
        if self.avatar is not None:
            row["avatar_emoji"] = self.avatar
        if self.gender is not None:
            row["gender"] = GENDER_TO_DB[self.gender]
        if self.age is not None:
            row["date_of_birth"] = birth_date_for_age(self.age, today).isoformat()
        if self.occupation is not None:
            row["occupation"] = self.occupation
        if self.favoriteCoffee is not None:
            row["favorite_coffee"] = self.favoriteCoffee
        return row


def birth_date_for_age(age: int, today: date) -> date:
    """The app collects an age, the database stores a date of birth."""
    year = today.year - age
    try:
        return today.replace(year=year)
    except ValueError:  # 29 Feb
        return today.replace(year=year, day=28)


class SurveyUpdate(StrictModel):
    answers: SurveyAnswers = Field(..., max_length=32)

    @field_validator("answers")
    @classmethod
    def _check_answers(cls, answers: SurveyAnswers) -> SurveyAnswers:
        for key, values in answers.items():
            if not (1 <= len(key) <= 40) or not key.replace("-", "").replace("_", "").isalnum():
                raise ValueError(f"invalid question key: {key!r}")
            if len(values) > 16:
                raise ValueError(f"too many answers for {key!r}")
            for value in values:
                if not isinstance(value, str) or not (1 <= len(value) <= 60):
                    raise ValueError(f"invalid answer for {key!r}")
        return answers


class SettingsUpdate(StrictModel):
    notificationsEnabled: bool | None = None
    remindersEnabled: bool | None = None


class ConfirmRequest(StrictModel):
    stage: ConfirmStage


class AttendanceRequest(StrictModel):
    happened: bool
    note: str | None = Field(None, max_length=1000)


class RatingRequest(StrictModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field("", max_length=1000)


class ReportCreate(StrictModel):
    reason: ReportReason
    details: str = Field(..., min_length=10, max_length=2000)
    eventId: UUID | None = None
    reportedUserId: UUID | None = None


class ReportStatusUpdate(StrictModel):
    status: ReportStatus


class EventCreate(StrictModel):
    eventAt: datetime
    targetGroupSize: int = Field(4, ge=2, le=8)
    defaultVenueId: UUID | None = None
    locationHidden: bool = True
    capacity: int = Field(40, ge=2, le=500)
    title: str | None = Field(None, max_length=120)

    @field_validator("eventAt")
    @classmethod
    def _needs_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("eventAt must include a timezone offset")
        return value
