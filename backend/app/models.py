from datetime import datetime, timezone
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class Arm(str, Enum):
    left = "left"
    right = "right"


class ErrorDetail(BaseModel):
    code: str
    message: str
    quality_flags: list[str] = Field(default_factory=list)


class MeasurementResponse(BaseModel):
    measurement_id: UUID
    client_request_id: str
    measurement_type: str = "shoulder_to_wrist"
    value_cm: float = Field(gt=0)
    confidence: float = Field(ge=0, le=1)
    quality_status: str
    quality_flags: list[str]
    model_version: str
    algorithm_version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorResponse(BaseModel):
    detail: ErrorDetail


class ProcessingResult(BaseModel):
    value_cm: float
    confidence: float
    quality_status: str
    quality_flags: list[str]
    model_version: str
    algorithm_version: str
