import pytest

from backend.app.measurement.engine import Landmark, MeasurementError, measure_arm_length
from io import BytesIO

from PIL import Image


class FakeAdapter:
    model_version = "fake-v1"

    def detect(self, _image_bytes):
        points = [Landmark(0.5, 0.1, 1.0) for _ in range(33)]
        points[0] = Landmark(0.5, 0.1, 1.0)
        points[27] = Landmark(0.5, 0.9, 1.0)
        points[28] = Landmark(0.5, 0.9, 1.0)
        points[31] = Landmark(0.5, 0.9, 1.0)
        points[32] = Landmark(0.5, 0.9, 1.0)
        points[12] = Landmark(0.4, 0.4, 1.0)
        points[14] = Landmark(0.4, 0.6, 1.0)
        points[16] = Landmark(0.4, 0.8, 1.0)
        return points


def test_measures_right_shoulder_to_wrist_chain():
    image = Image.new("RGB", (100, 100), "white")
    output = BytesIO()
    image.save(output, format="PNG")
    result = measure_arm_length(output.getvalue(), output.getvalue(), 180, "right", FakeAdapter())
    assert result["value_cm"] == 90.0
    assert result["quality_status"] == "ok"


def _image_bytes(size=(100, 100)):
    image = Image.new("RGB", size, "white")
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def test_measures_left_arm():
    class LeftAdapter(FakeAdapter):
        def detect(self, image_bytes):
            points = super().detect(image_bytes)
            points[11] = Landmark(0.6, 0.4, 1.0)
            points[13] = Landmark(0.6, 0.6, 1.0)
            points[15] = Landmark(0.6, 0.8, 1.0)
            return points

    result = measure_arm_length(_image_bytes(), _image_bytes(), 180, "left", LeftAdapter())
    assert result["value_cm"] == 90.0


def test_rejects_invalid_height():
    with pytest.raises(MeasurementError) as error:
        measure_arm_length(_image_bytes(), _image_bytes(), 0, "right", FakeAdapter())
    assert error.value.code == "invalid_height"


def test_rejects_low_confidence_arm():
    class LowConfidenceAdapter(FakeAdapter):
        def detect(self, image_bytes):
            points = super().detect(image_bytes)
            points[14] = Landmark(0.4, 0.6, 0.2)
            return points

    with pytest.raises(MeasurementError) as error:
        measure_arm_length(_image_bytes(), _image_bytes(), 180, "right", LowConfidenceAdapter())
    assert error.value.code == "low_confidence"
