from dataclasses import dataclass
from io import BytesIO
from math import hypot, isfinite
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
            import numpy as np

            image = Image.open(BytesIO(image_bytes)).convert("RGB")
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
        landmarks = []
        for point in result.pose_landmarks[0]:
            # Visibility and presence are both useful signals. MediaPipe normally
            # supplies both, but treating a missing value as zero is safer than
            # allowing an invalid landmark into calibration.
            visibility = getattr(point, "visibility", 0.0) or 0.0
            presence = getattr(point, "presence", 0.0) or 0.0
            landmarks.append(Landmark(point.x, point.y, min(visibility, presence)))
        return landmarks


def _indices(arm: str) -> tuple[int, int, int]:
    return (11, 13, 15) if arm == "left" else (12, 14, 16)


def _pixel_height(points: list[Landmark], width: int, height: int) -> float:
    # Nose to the lowest ankle/foot is robust enough for the guided full-body pose.
    y_values = [points[i].y for i in (0, 27, 28, 31, 32)]
    return (max(y_values) - min(y_values)) * height


def _arm_pixels(points: list[Landmark], arm: str, width: int, height: int) -> float:
    shoulder, elbow, wrist = _indices(arm)
    required = [shoulder, elbow, wrist]
    if any(points[i].confidence < 0.45 for i in required):
        raise MeasurementError("low_confidence", "Arm landmarks are not reliable.", ["low_arm_confidence"])

    def distance(a: Landmark, b: Landmark) -> float:
        return hypot((a.x - b.x) * width, (a.y - b.y) * height)

    length = distance(points[shoulder], points[elbow]) + distance(points[elbow], points[wrist])
    if not isfinite(length) or length <= 0:
        raise MeasurementError("invalid_pose", "The selected arm landmarks do not form a measurable chain.")
    return length


def measure_arm_length(
    front_bytes: bytes,
    side_bytes: bytes,
    height_cm: float,
    arm: str,
    adapter: PoseAdapter,
):
    if not isfinite(height_cm) or height_cm < 1 or height_cm > 300:
        raise MeasurementError("invalid_height", "height_cm must be between 1 and 300.")
    if arm not in {"left", "right"}:
        raise MeasurementError("invalid_arm", "arm must be left or right.")

    measurements: list[float] = []
    body_heights: list[float] = []
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
        if any(
            not all(isfinite(value) for value in (point.x, point.y, point.confidence))
            or point.confidence < 0
            or point.confidence > 1
            for point in points[:33]
        ):
            raise MeasurementError("invalid_pose", "Pose model returned invalid landmarks.")
        body_height = _pixel_height(points, width, height)
        if not isfinite(body_height) or body_height <= 0:
            raise MeasurementError("invalid_pose", "Unable to calibrate body height from landmarks.")
        if body_height < height * 0.25:
            raise MeasurementError("body_too_small", "The full body must occupy more of the frame.", ["body_too_small"])
        if min(points[i].confidence for i in (0, 27, 28, 31, 32)) < 0.35:
            raise MeasurementError("low_body_confidence", "Head and feet must be visible.", ["low_body_confidence"])
        scale = height_cm / body_height
        measurements.append(_arm_pixels(points, arm, width, height) * scale)
        body_heights.append(body_height)
        confidences.append(sum(points[i].confidence for i in _indices(arm)) / 3)

    if abs(body_heights[0] - body_heights[1]) / max(body_heights) > 0.15:
        raise MeasurementError(
            "inconsistent_scale",
            "Front and side views have inconsistent body scale.",
            ["inconsistent_scale"],
        )

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
