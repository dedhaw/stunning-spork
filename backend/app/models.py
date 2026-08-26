from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class Arm(str, Enum):
    left = "left"
    right = "right"


class MeasurementResponse(BaseModel):
    measurement_id: UUID
    measurement_type: str = "shoulder_to_wrist"
    value_cm: float = Field(gt=0)
    confidence: float = Field(ge=0, le=1)
    quality_status: str
    quality_flags: list[str]
    model_version: str
    algorithm_version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorResponse(BaseModel):
    detail: str
    code: str
    quality_flags: list[str] = []


class ProcessingResult(BaseModel):
    value_cm: float
    confidence: float
    quality_status: str
    quality_flags: list[str]
    model_version: str
    algorithm_version: str

