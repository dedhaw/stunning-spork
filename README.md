# stunning-spork

Web-first arm measurement prototype. The initial product measures estimated shoulder-to-wrist length from guided front and side webcam captures; native iOS capture is a future client.

## Quick start

```bash
make setup
make run
```

Open http://localhost:8000. `make setup` creates `.venv` and installs `backend/requirements.txt`. `make run` starts FastAPI and serves the webpage with Uvicorn. Docker Compose is deferred until additional services are needed.

For real pose processing, set `MEDIAPIPE_MODEL_PATH` to a compatible MediaPipe Pose Landmarker model asset. Without it, measurement requests return a clear `model_not_configured` error.

The development server binds to `127.0.0.1:8000`; camera access works on `localhost` or over HTTPS. Run `make test` to execute the backend test suite. `make setup` is idempotent and creates the local `.venv` used by the other commands.

## Architecture

The browser requests camera permission, shows a live preview, and captures two images while the device stays fixed: one front view and one side view after the user rotates 90 degrees. The user enters height in centimeters and selects an arm. The backend detects landmarks, estimates pixel scale from full head-to-toe body height, and calculates shoulder-to-wrist length from the shoulder-elbow-wrist chain.

The capture instructions require a stable surface or tripod, a level camera around waist/chest height, enough distance for head and feet to fit, fitted clothing, and an arm held slightly away from the torso. Height calibrates pixels to centimeters; it does not correct camera pitch, so framing and level guidance remain necessary.

The web client uses `getUserMedia`, `<video>`, and `<canvas>`. Camera access requires HTTPS or `localhost` and user permission. The backend uses FastAPI, Pydantic, multipart `UploadFile`, MediaPipe Pose Landmarker behind an adapter, OpenCV/Pillow, NumPy, and Pytest.

## API

`POST /v1/measurements/arm-length` accepts multipart fields `front_image`, `side_image`, `height_cm`, `arm` (`left` or `right`), and `client_request_id`. It returns a versioned measurement, the echoed request ID, confidence, quality status/flags, model version, algorithm version, and timestamp. Validation and processing failures return a structured error code and message. Source images are not returned.

Images must be JPEG, PNG, or WebP and no larger than 12 MB each. Heights must be between 1 and 300 cm; request IDs are required, trimmed, and limited to 128 characters. The API rejects unsupported/oversized images, missing landmarks, low confidence, multiple people, cropped bodies, invalid poses, and inconsistent front/side scale. Model configuration/runtime failures use `503`; request and measurement validation failures use a structured `422` response, while unsupported media and oversized uploads use `415` and `413`.

Example request:

```bash
curl -X POST http://localhost:8000/v1/measurements/arm-length \
  -F front_image=@front.jpg -F side_image=@side.jpg \
  -F height_cm=180 -F arm=right -F client_request_id=demo-001
```

The initial target is approximately ±3 cm and is not a production accuracy guarantee. Consumers should treat `quality_status: "review"` or any quality flag as requiring a retake or human review.

## Privacy

Source images are sensitive biometric-adjacent data. Keep them in memory or temporary request storage only, delete them after processing, and never persist them as part of a measurement record by default. Do not log image contents, raw multipart bodies, pose landmarks, or full request payloads. Logs and analytics should contain only operational metadata such as status, duration, error code, and the client request ID; apply access controls and retention limits to those logs as well. Obtain user consent for camera access and explain the purpose before capture. Any future persistence, third-party model service, or production deployment requires a separate privacy/security review.

## Validation protocol

Before making accuracy claims or changing the algorithm/model version, compare results with a documented manual shoulder-to-wrist measurement using the same arm and a consistent anatomical procedure. Hold out a test set and cover body sizes, left/right arms, clothing, skin tones, lighting, camera distances, device/browser combinations, and common framing mistakes. Record the input conditions, model/algorithm versions, measured value, manual reference, quality status, quality flags, and whether processing failed.

Report at minimum:

- mean absolute error (MAE) and median absolute error in centimeters;
- error distribution, including a 95th percentile or confidence interval;
- success/failure rate, with failures grouped by error code and quality flag; and
- results broken down by the tested body, environment, and device cohorts.

Do not publish a ±3 cm claim until the sample size, protocol, exclusions, and cohort results are reviewed. Re-run the validation set whenever `MEDIAPIPE_MODEL_PATH`, `model_version`, `ALGORITHM_VERSION`, capture guidance, or image preprocessing changes. The API’s version fields make those comparisons explicit.

## Future iOS client

The same versioned API and measurement engine can later support a native Swift client using AVFoundation, Vision, CoreMotion, ARKit, and optional depth capture.

## Agent tasks

Implementation work is split into ranked, dependency-aware tasks in [`tasks/README.md`](tasks/README.md). Every agent must read this README and its assigned task file. Dependent agents wait until the dependency file contains the checked completion marker.

Agents should run `make test` after implementation, preserve unrelated working-tree changes, and update only the checkboxes in their assigned task file. A task is complete only when implementation, tests, and any required documentation are complete and the final `Done with implementation and testing` marker is checked.
