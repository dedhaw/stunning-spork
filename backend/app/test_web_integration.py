from pathlib import Path


WEB_DIR = Path(__file__).resolve().parents[2] / "web"


def test_web_page_exposes_capture_and_result_controls():
    html = (WEB_DIR / "index.html").read_text()

    for element_id in ("height", "arm", "capture", "submit", "result", "result-value", "result-quality"):
        assert f'id="{element_id}"' in html
    assert 'src="/static/app.js"' in html


def test_client_submits_api_contract_and_renders_metadata():
    javascript = (WEB_DIR / "app.js").read_text()

    for field in ("front_image", "side_image", "height_cm", "arm", "client_request_id"):
        assert f'body.append(\'{field}\'' in javascript
    assert "fetch('/v1/measurements/arm-length'" in javascript
    for marker in ("quality_status", "quality_flags", "client_request_id", "showResult(payload)"):
        assert marker in javascript


def test_client_has_loading_and_structured_error_states():
    javascript = (WEB_DIR / "app.js").read_text()

    assert "submit.textContent = 'Processing…'" in javascript
    assert "detail?.message" in javascript
    assert "Could not submit the measurement" in javascript
