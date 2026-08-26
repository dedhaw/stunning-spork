from backend.app.measurement.engine import Landmark, measure_arm_length
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
