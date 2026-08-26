from fastapi.testclient import TestClient
from io import BytesIO

from PIL import Image

from backend.app import main

app = main.app


def image_bytes(format="PNG"):
    output = BytesIO()
    Image.new("RGB", (8, 8), "white").save(output, format=format)
    return output.getvalue()


def test_index_is_served():
    response = TestClient(app).get("/")
    assert response.status_code == 200
    assert "Arm measurement" in response.text


def test_rejects_non_image_uploads():
    client = TestClient(app)
    response = client.post(
        "/v1/measurements/arm-length",
        files={"front_image": ("a.txt", b"x", "text/plain"), "side_image": ("b.jpg", b"x", "image/jpeg")},
        data={"height_cm": "180", "arm": "right", "client_request_id": "test-1"},
    )
    assert response.status_code == 415


def test_returns_versioned_measurement_and_request_id(monkeypatch):
    monkeypatch.setattr(
        main,
        "measure_arm_length",
        lambda *_args: {
            "value_cm": 72.4,
            "confidence": 0.91,
            "quality_status": "ok",
            "quality_flags": [],
            "model_version": "fake-v1",
            "algorithm_version": "pixel-scale-v1",
        },
    )
    response = TestClient(app).post(
        "/v1/measurements/arm-length",
        files={
            "front_image": ("front.png", image_bytes(), "image/png"),
            "side_image": ("side.png", image_bytes(), "image/png"),
        },
        data={"height_cm": "180", "arm": "right", "client_request_id": "client-42"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["client_request_id"] == "client-42"
    assert payload["measurement_type"] == "shoulder_to_wrist"
    assert payload["algorithm_version"] == "pixel-scale-v1"
    assert payload["measurement_id"]
    assert payload["created_at"]


def test_rejects_blank_request_id():
    response = TestClient(app).post(
        "/v1/measurements/arm-length",
        files={
            "front_image": ("front.png", image_bytes(), "image/png"),
            "side_image": ("side.png", image_bytes(), "image/png"),
        },
        data={"height_cm": "180", "arm": "right", "client_request_id": "   "},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "missing_request_id"
