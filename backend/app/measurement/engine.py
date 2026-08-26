from dataclasses import dataclass
from io import BytesIO
from math import hypot, sqrt
from typing import Protocol

from PIL import Image


ALGORITHM_VERSION = "pixel-scale-v1"


@dataclass(frozen=True)
class Landmark:
    x: float
    y: float
    confidence: float


class PoseAdapter(Protocol):
    model_version: str

    def detect(self, image_bytes: bytes) -> list[Landmark]: ...


class MeasurementError(Exception):
    def __init__(self, code: str, detail: str, flags: list[str] | None = None):
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.flags = flags or []


class MediaPipePoseAdapter:
    """Lazy MediaPipe adapter. A model asset is supplied through MEDIAPIPE_MODEL_PATH."""

    model_version = "mediapipe-pose-landmarker"

    def __init__(self, model_path: str | None = None):
        import os

        self.model_path = model_path or os.getenv("MEDIAPIPE_MODEL_PATH")
        self._landmarker = None

    def _load(self):
        if self._landmarker is not None:
            return self._landmarker
        if not self.model_path:
            raise MeasurementError(
                "model_not_configured",
                "Set MEDIAPIPE_MODEL_PATH to a Pose Landmarker model asset.",
            )
        try:
            import mediapipe as mp

            options = mp.tasks.vision.PoseLandmarkerOptions(
                base_options=mp.tasks.BaseOptions(model_asset_path=self.model_path),
                running_mode=mp.tasks.vision.RunningMode.IMAGE,
                num_poses=2,
            )
            self._landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(options)
            return self._landmarker
        except Exception as exc:  # model/runtime errors become a stable API error
            raise MeasurementError("pose_model_unavailable", str(exc)) from exc

    def detect(self, image_bytes: bytes) -> list[Landmark]:
        try:
            import mediapipe as mp

            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image.tobytes())
            # MediaPipe requires an ndarray-like shape; use its supported image helper.
            import numpy as np

            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(image))
            result = self._load().detect(mp_image)
        except MeasurementError:
            raise
        except Exception as exc:
            raise MeasurementError("invalid_image", "Unable to decode or process image.") from exc
        if not result.pose_landmarks:
            raise MeasurementError("no_person", "No person was detected.", ["no_person"])
        if len(result.pose_landmarks) > 1:
            raise MeasurementError("multiple_people", "Exactly one person must be visible.", ["multiple_people"])
        return [Landmark(p.x, p.y, min(p.visibility, p.presence)) for p in result.pose_landmarks[0]]


def _indices(arm: str) -> tuple[int, int, int]:
    return (11, 13, 15) if arm == "left" else (12, 14, 16)


def _pixel_height(points: list[Landmark], width: int, height: int) -> float:
    # Nose to the lowest ankle/foot is robust enough for the guided full-body pose.
    y_values = [points[0].y, points[27].y, points[28].y, points[31].y, points[32].y]
    return (max(y_values) - min(y_values)) * height


def _arm_pixels(points: list[Landmark], arm: str, width: int, height: int) -> float:
    shoulder, elbow, wrist = _indices(arm)
    required = [shoulder, elbow, wrist]
    if any(points[i].confidence < 0.45 for i in required):
        raise MeasurementError("low_confidence", "Arm landmarks are not reliable.", ["low_arm_confidence"])

    def distance(a: Landmark, b: Landmark) -> float:
        return hypot((a.x - b.x) * width, (a.y - b.y) * height)

    return distance(points[shoulder], points[elbow]) + distance(points[elbow], points[wrist])


def measure_arm_length(
    front_bytes: bytes,
    side_bytes: bytes,
    height_cm: float,
    arm: str,
    adapter: PoseAdapter,
):
    if height_cm <= 0 or height_cm > 300:
        raise MeasurementError("invalid_height", "height_cm must be between 1 and 300.")
    if arm not in {"left", "right"}:
        raise MeasurementError("invalid_arm", "arm must be left or right.")

    measurements: list[float] = []
    confidences: list[float] = []
    for image_bytes in (front_bytes, side_bytes):
        try:
            image = Image.open(BytesIO(image_bytes))
            width, height = image.size
        except Exception as exc:
            raise MeasurementError("invalid_image", "Unable to decode image.") from exc
        points = adapter.detect(image_bytes)
        if len(points) < 33:
            raise MeasurementError("incomplete_pose", "Pose model returned incomplete landmarks.")
        body_height = _pixel_height(points, width, height)
        if body_height < height * 0.25:
            raise MeasurementError("body_too_small", "The full body must occupy more of the frame.", ["body_too_small"])
        if min(points[i].confidence for i in (0, 27, 28)) < 0.35:
            raise MeasurementError("low_body_confidence", "Head and feet must be visible.", ["low_body_confidence"])
        scale = height_cm / body_height
        measurements.append(_arm_pixels(points, arm, width, height) * scale)
        confidences.append(sum(points[i].confidence for i in _indices(arm)) / 3)

    value = sum(measurements) / len(measurements)
    confidence = max(0.0, min(1.0, sum(confidences) / len(confidences)))
    flags = []
    if abs(measurements[0] - measurements[1]) / value > 0.15:
        flags.append("front_side_disagreement")
    return {
        "value_cm": round(value, 1),
        "confidence": round(confidence, 3),
        "quality_status": "review" if flags else "ok",
        "quality_flags": flags,
        "model_version": adapter.model_version,
        "algorithm_version": ALGORITHM_VERSION,
    }
