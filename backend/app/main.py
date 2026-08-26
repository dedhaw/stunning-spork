from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .measurement.engine import MediaPipePoseAdapter, MeasurementError, measure_arm_length
from .models import Arm, ErrorResponse, MeasurementResponse


BASE_DIR = Path(__file__).resolve().parents[2]
WEB_DIR = BASE_DIR / "web"
MAX_IMAGE_BYTES = 12 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_REQUEST_ID_LENGTH = 128
adapter = MediaPipePoseAdapter()
app = FastAPI(title="Arm Measurement API", version="1.0.0")


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(WEB_DIR / "index.html")


app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")


async def _read_image(upload: UploadFile) -> bytes:
    if upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, detail={"code": "unsupported_image", "message": "Use JPEG, PNG, or WebP."})
    data = await upload.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, detail={"code": "image_too_large", "message": "Image exceeds 12 MB."})
    return data


@app.post(
    "/v1/measurements/arm-length",
    response_model=MeasurementResponse,
    responses={
        415: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def arm_length(
    front_image: UploadFile = File(...),
    side_image: UploadFile = File(...),
    height_cm: float = Form(...),
    arm: Arm = Form(...),
    client_request_id: str = Form(...),
):
    client_request_id = client_request_id.strip()
    if not client_request_id:
        raise HTTPException(422, detail={"code": "missing_request_id", "message": "client_request_id is required."})
    if len(client_request_id) > MAX_REQUEST_ID_LENGTH:
        raise HTTPException(422, detail={"code": "request_id_too_long", "message": "client_request_id is too long."})

    front = await _read_image(front_image)
    side = await _read_image(side_image)
    try:
        result = measure_arm_length(front, side, height_cm, arm.value, adapter)
    except MeasurementError as exc:
        status = 503 if exc.code in {"model_not_configured", "pose_model_unavailable"} else 422
        raise HTTPException(status, detail={"code": exc.code, "message": exc.detail, "quality_flags": exc.flags}) from exc
    return MeasurementResponse(measurement_id=uuid4(), client_request_id=client_request_id, **result)
