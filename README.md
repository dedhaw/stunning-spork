# stunning-spork

Web-first arm measurement prototype. The initial product measures estimated shoulder-to-wrist length from guided front and side webcam captures; native iOS capture is a future client.

## Quick start

```bash
make setup
make run
```

Open http://localhost:8000. `make setup` creates `.venv` and installs `backend/requirements.txt`. `make run` starts FastAPI and serves the webpage with Uvicorn. Docker Compose is deferred until additional services are needed.

For real pose processing, set `MEDIAPIPE_MODEL_PATH` to a compatible MediaPipe Pose Landmarker model asset. Without it, measurement requests return a clear `model_not_configured` error.

## Architecture

The browser requests camera permission, shows a live preview, and captures two images while the device stays fixed: one front view and one side view after the user rotates 90 degrees. The user enters height in centimeters and selects an arm. The backend detects landmarks, estimates pixel scale from full head-to-toe body height, and calculates shoulder-to-wrist length from the shoulder-elbow-wrist chain.

The capture instructions require a stable surface or tripod, a level camera around waist/chest height, enough distance for head and feet to fit, fitted clothing, and an arm held slightly away from the torso. Height calibrates pixels to centimeters; it does not correct camera pitch, so framing and level guidance remain necessary.

The web client uses `getUserMedia`, `<video>`, and `<canvas>`. Camera access requires HTTPS or `localhost` and user permission. The backend uses FastAPI, Pydantic, multipart `UploadFile`, MediaPipe Pose Landmarker behind an adapter, OpenCV/Pillow, NumPy, and Pytest.

## API

`POST /v1/measurements/arm-length` accepts multipart fields `front_image`, `side_image`, `height_cm`, `arm` (`left` or `right`), and `client_request_id`. It returns a versioned measurement, confidence, quality status/flags, model version, algorithm version, and timestamp. Source images are not returned.

The API rejects unsupported/oversized images, missing landmarks, low confidence, multiple people, cropped bodies, and inconsistent front/side scale. The initial target is approximately ±3 cm and is not a production accuracy guarantee.

## Privacy and validation

Source images should be temporary and deleted after processing by default. Do not log image contents. Before making accuracy claims, validate against manual measurements across body sizes, clothing, lighting, camera distances, and devices; report mean/median absolute error and failure rate.

## Future iOS client

The same versioned API and measurement engine can later support a native Swift client using AVFoundation, Vision, CoreMotion, ARKit, and optional depth capture.

## Agent tasks

Implementation work is split into ranked, dependency-aware tasks in [`tasks/README.md`](tasks/README.md). Every agent must read this README and its assigned task file. Dependent agents wait until the dependency file contains the checked completion marker.
