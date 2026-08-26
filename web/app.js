const preview = document.querySelector('#preview');
const canvas = document.querySelector('#canvas');
const start = document.querySelector('#start');
const capture = document.querySelector('#capture');
const submit = document.querySelector('#submit');
const status = document.querySelector('#status');
const instruction = document.querySelector('#instruction');
let stream;
let frontBlob;
let sideBlob;

start.onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1920 } }, audio: false });
    preview.srcObject = stream;
    capture.disabled = false;
    status.textContent = 'Camera ready.';
  } catch (error) {
    status.textContent = `Camera unavailable: ${error.message}`;
  }
};

capture.onclick = () => {
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;
  canvas.getContext('2d').drawImage(preview, 0, 0);
  canvas.toBlob(blob => {
    if (!frontBlob) {
      frontBlob = blob;
      capture.textContent = 'Capture side';
      instruction.textContent = 'Rotate your body 90°. Keep the camera fixed, keep your arm slightly away from your torso, then capture again.';
      status.textContent = 'Front image captured.';
    } else {
      sideBlob = blob;
      capture.disabled = true;
      submit.disabled = false;
      status.textContent = 'Both images captured.';
    }
  }, 'image/jpeg', .92);
};

submit.onclick = async () => {
  const height = document.querySelector('#height').value;
  if (!height || !frontBlob || !sideBlob) { status.textContent = 'Enter height and capture both views.'; return; }
  const body = new FormData();
  body.append('front_image', frontBlob, 'front.jpg');
  body.append('side_image', sideBlob, 'side.jpg');
  body.append('height_cm', height);
  body.append('arm', document.querySelector('#arm').value);
  body.append('client_request_id', crypto.randomUUID());
  status.textContent = 'Processing…';
  const response = await fetch('/v1/measurements/arm-length', { method: 'POST', body });
  const payload = await response.json();
  status.textContent = response.ok ? `Estimated arm length: ${payload.value_cm} cm (confidence ${payload.confidence})` : `${payload.detail?.message || payload.detail || 'Processing failed'}`;
};
