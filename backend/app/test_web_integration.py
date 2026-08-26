from pathlib import Path

from fastapi.testclient import TestClient

from .main import app


WEB_DIR = Path(__file__).resolve().parents[2] / "web"


def test_web_page_exposes_capture_and_result_controls():
    response = TestClient(app).get("/")
    assert response.status_code == 200
    assert '<div id="root"></div>' in response.text
    assert '/app.js' in response.text
    assert TestClient(app).get('/static/app.js').status_code == 200


def test_client_submits_api_contract_and_renders_metadata():
    javascript = (WEB_DIR / "app.js").read_text()

    for field in ("front_image", "side_image", "height_cm", "arm", "client_request_id"):
        assert field in javascript
    assert "/v1/measurements/arm-length" in javascript
    for marker in ("quality_status", "quality_flags", "client_request_id", "Measurement result"):
        assert marker in javascript


def test_client_has_loading_and_structured_error_states():
    javascript = (WEB_DIR / "app.js").read_text()

    assert "Processing…" in javascript
    assert "detail" in javascript
    assert "Could not submit the measurement" in javascript
