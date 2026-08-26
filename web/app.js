const preview = document.querySelector('#preview');
const canvas = document.querySelector('#canvas');
const heightInput = document.querySelector('#height');
const armInput = document.querySelector('#arm');
const start = document.querySelector('#start');
const capture = document.querySelector('#capture');
const submit = document.querySelector('#submit');
const status = document.querySelector('#status');
const instruction = document.querySelector('#instruction');
const stage = document.querySelector('#stage');
const heading = document.querySelector('#capture-heading');
const cameraStatus = document.querySelector('#camera-status');
const captures = document.querySelector('#captures');
const result = document.querySelector('#result');
const resultValue = document.querySelector('#result-value');
const resultSummary = document.querySelector('#result-summary');
const resultQuality = document.querySelector('#result-quality');
const resultFlags = document.querySelector('#result-flags');
const resultRequestId = document.querySelector('#result-request-id');
const state = { stream: null, front: null, side: null, activeView: 'front', submitting: false };
window.measurementCapture = state;

function setStatus(message, tone = '') { status.textContent = message; status.dataset.tone = tone; }
function setStage(number, title, message) { stage.textContent = `Step ${number} of 3`; heading.textContent = title; instruction.textContent = message; }
function errorMessage(payload) {
  const detail = payload?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return 'Processing failed. Try again.';
}
function showResult(payload) {
  resultValue.textContent = Number(payload.value_cm).toFixed(1);
  resultSummary.textContent = `Confidence ${(Number(payload.confidence) * 100).toFixed(0)}%.`;
  resultQuality.textContent = payload.quality_status || 'Unknown';
  resultFlags.textContent = payload.quality_flags?.length ? payload.quality_flags.join(', ') : 'None';
  resultRequestId.textContent = payload.client_request_id || '—';
  result.hidden = false;
}
function updateControls() {
  const ready = Boolean(state.stream && preview.videoWidth);
  capture.disabled = !ready || state.submitting;
  submit.disabled = !(state.front && state.side) || state.submitting;
  capture.textContent = state.activeView === 'front' ? 'Capture front' : 'Capture side';
  start.textContent = ready ? 'Restart camera' : 'Allow camera';
}
function showCapture(view, blob) {
  captures.hidden = false;
  const figure = document.querySelector(`#${view}-capture`);
  figure.hidden = false;
  const image = figure.querySelector('img');
  if (image.src) URL.revokeObjectURL(image.src);
  image.src = URL.createObjectURL(blob);
}
function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach(track => track.stop());
  state.stream = null; preview.srcObject = null;
  cameraStatus.textContent = 'Stopped'; cameraStatus.className = 'status-pill'; updateControls();
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { setStatus('Camera access is not supported in this browser. Use a recent browser on HTTPS or localhost.', 'error'); return; }
  stopCamera();
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1920 } }, audio: false });
    preview.srcObject = state.stream; await preview.play();
    cameraStatus.textContent = 'Ready'; cameraStatus.className = 'status-pill ready';
    if (state.activeView === 'front') {
      setStage(2, 'Capture your front view', 'Stand straight with your selected arm slightly away from your torso. Check that your head and feet are visible, then capture.');
    } else {
      setStage(3, 'Capture your side view', 'Turn 90° to the side while keeping the camera fixed. Keep your arm slightly away from your torso, then capture.');
    }
    setStatus('Camera ready.'); updateControls();
  } catch (error) {
    state.stream = null;
    const reason = error.name === 'NotAllowedError' ? 'Allow camera access in your browser settings and try again.' : error.name === 'NotFoundError' ? 'No camera was found on this device.' : 'The camera could not be started. Check permissions and try again.';
    setStatus(reason, 'error'); cameraStatus.textContent = 'Unavailable'; cameraStatus.className = 'status-pill error'; updateControls();
  }
}

function captureView() {
  if (!state.stream || !preview.videoWidth || !preview.videoHeight) { setStatus('Wait for the camera preview to appear.', 'error'); return; }
  canvas.width = preview.videoWidth; canvas.height = preview.videoHeight;
  canvas.getContext('2d').drawImage(preview, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => {
    if (!blob) { setStatus('This browser could not capture an image. Try again.', 'error'); return; }
    state[state.activeView] = blob; showCapture(state.activeView, blob);
    if (state.activeView === 'front') {
      state.activeView = 'side'; setStage(3, 'Capture your side view', 'Turn 90° to the side while keeping the camera fixed. Keep your arm slightly away from your torso, then capture.'); setStatus('Front view captured.');
    } else {
      setStage(3, 'Ready to submit', 'Both views are ready. Review the thumbnails, then submit when your height and arm are correct.'); setStatus('Both views captured.'); stopCamera();
    }
    updateControls();
  }, 'image/jpeg', 0.92);
}

async function submitMeasurement() {
  const height = Number(heightInput.value);
  if (!Number.isFinite(height) || height < 1 || height > 300) { setStatus('Enter a height between 1 and 300 cm.', 'error'); heightInput.focus(); return; }
  if (!state.front || !state.side) { setStatus('Capture both the front and side views first.', 'error'); return; }
  state.submitting = true; updateControls(); submit.textContent = 'Processing…'; setStatus('Processing…');
  const body = new FormData();
  body.append('front_image', state.front, 'front.jpg'); body.append('side_image', state.side, 'side.jpg'); body.append('height_cm', heightInput.value); body.append('arm', armInput.value);
  body.append('client_request_id', crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  try { const response = await fetch('/v1/measurements/arm-length', { method: 'POST', body }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(errorMessage(payload)); showResult(payload); setStatus(`Estimated arm length: ${Number(payload.value_cm).toFixed(1)} cm.`, 'success'); }
  catch (error) { setStatus(error.message || 'Could not submit the measurement. Check your connection and try again.', 'error'); }
  finally { state.submitting = false; submit.textContent = 'Submit measurement'; updateControls(); }
}

start.addEventListener('click', startCamera); capture.addEventListener('click', captureView); submit.addEventListener('click', submitMeasurement);
document.querySelectorAll('[data-retake]').forEach(button => button.addEventListener('click', () => { const view = button.dataset.retake; state[view] = null; state.activeView = view; setStatus(`Ready to retake the ${view} view.`); startCamera(); }));
window.addEventListener('pagehide', stopCamera); updateControls();
