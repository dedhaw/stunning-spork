from fastapi.testclient import TestClient

from backend.app.main import app


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
