import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { getErrorMessage, requestMeasurement } from './api/measurement.js';

export { getErrorMessage, requestMeasurement };

const copy = {
  setup: ['Set up your camera', 'Place your device on a stable surface at about waist or chest height. Keep it level and stand far enough away for your head and feet to fit.'],
  front: ['Capture your front view', 'Stand straight with your selected arm slightly away from your torso. Check that your head and feet are visible, then capture.'],
  side: ['Capture your side view', 'Turn 90° to the side while keeping the camera fixed. Keep your arm slightly away from your torso, then capture.'],
};
const CAPTURE_COUNTDOWN_SECONDS = 3;

export function Result({ value }) {
  return <section className="card result" aria-labelledby="result-heading">
    <p className="eyebrow">Measurement result</p><h2 id="result-heading"><span id="result-value">{Number(value.value_cm).toFixed(1)}</span> cm</h2>
    <p id="result-summary">Confidence {(Number(value.confidence) * 100).toFixed(0)}%. Use this estimate as a guide, not a guarantee.</p>
    <dl className="result-details"><div><dt>Quality</dt><dd id="result-quality">{value.quality_status || 'Unknown'}</dd></div><div><dt>Quality flags</dt><dd id="result-flags">{value.quality_flags?.length ? value.quality_flags.join(', ') : 'None'}</dd></div><div><dt>Request ID</dt><dd id="result-request-id">{value.client_request_id || '—'}</dd></div><div><dt>Model</dt><dd>{value.model_version || '—'}</dd></div><div><dt>Algorithm</dt><dd>{value.algorithm_version || '—'}</dd></div><div><dt>Created</dt><dd>{value.created_at ? new Date(value.created_at).toLocaleString() : '—'}</dd></div></dl>
  </section>;
}

export function App() {
  const video = useRef(null); const canvas = useRef(null);
  const [height, setHeight] = useState(''); const [arm, setArm] = useState('left');
  const [stream, setStream] = useState(null); const [captures, setCaptures] = useState({ front: null, side: null });
  const [view, setView] = useState('front'); const [status, setStatus] = useState({ message: '', tone: '' });
  const [cameraStatus, setCameraStatus] = useState('Not started'); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState(null);
  const requestAbort = useRef(null); const [lastRequest, setLastRequest] = useState(null);
  const [ready, setReady] = useState(false);
  const captureTimer = useRef(null); const [countdown, setCountdown] = useState(0); const [capturingView, setCapturingView] = useState(null);
  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);
  useEffect(() => () => { if (captureTimer.current) clearInterval(captureTimer.current); }, []);
  useEffect(() => { if (video.current) video.current.srcObject = stream; }, [stream]);
  const [title, instruction] = view === 'front' && !stream ? copy.setup : copy[view];
  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setStatus({ message: 'Camera access is not supported in this browser. Use HTTPS or localhost.', tone: 'error' }); return; }
    stream?.getTracks().forEach((track) => track.stop());
    try { const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1920 } }, audio: false }); setStream(next); setCameraStatus('Ready'); setStatus({ message: 'Camera ready.' }); setReady(false); }
    catch (error) { setCameraStatus('Unavailable'); setStatus({ message: error.name === 'NotAllowedError' ? 'Allow camera access in your browser settings and try again.' : error.name === 'NotFoundError' ? 'No camera was found on this device.' : 'The camera could not be started. Check permissions and try again.', tone: 'error' }); }
  };
  const captureFrame = (captureTarget) => {
    if (!video.current?.videoWidth) { setCapturingView(null); setCountdown(0); setStatus({ message: 'Wait for the camera preview to appear.', tone: 'error' }); return; }
    canvas.current.width = video.current.videoWidth; canvas.current.height = video.current.videoHeight; canvas.current.getContext('2d').drawImage(video.current, 0, 0);
    canvas.current.toBlob((blob) => { setCapturingView(null); setCountdown(0); if (!blob) return setStatus({ message: 'This browser could not capture an image. Try again.', tone: 'error' }); setCaptures((old) => ({ ...old, [captureTarget]: blob })); if (captureTarget === 'front') { setView('side'); setStatus({ message: 'Front view captured. Turn 90° and get ready for the side view.' }); } else { stream?.getTracks().forEach((track) => track.stop()); setStream(null); setStatus({ message: 'Both views captured.' }); } }, 'image/jpeg', 0.92);
  };
  const captureView = () => {
    if (captureTimer.current) return;
    if (!video.current?.videoWidth) { setStatus({ message: 'Wait for the camera preview to appear.', tone: 'error' }); return; }
    const captureTarget = view;
    setCapturingView(captureTarget); setCountdown(CAPTURE_COUNTDOWN_SECONDS);
    setStatus({ message: `Capturing ${captureTarget} in ${CAPTURE_COUNTDOWN_SECONDS}… Line up and hold still.` });
    captureTimer.current = setInterval(() => {
      setCountdown((remaining) => {
        if (remaining <= 1) { clearInterval(captureTimer.current); captureTimer.current = null; captureFrame(captureTarget); return 0; }
        const next = remaining - 1;
        setStatus({ message: `Capturing ${captureTarget} in ${next}… Line up and hold still.` });
        return next;
      });
    }, 1000);
  };
  const submit = async (request = { ...captures, height, arm }) => { const numericHeight = Number(request.height); if (!Number.isFinite(numericHeight) || numericHeight < 1 || numericHeight > 300) return setStatus({ message: 'Enter a height between 1 and 300 cm.', tone: 'error' }); if (!request.front || !request.side) return setStatus({ message: 'Capture both the front and side views first.', tone: 'error' }); setLastRequest(request); setSubmitting(true); setResult(null); setStatus({ message: 'Processing…' }); const controller = new AbortController(); requestAbort.current = controller; try { setResult(await requestMeasurement({ ...request, signal: controller.signal })); setStatus({ message: 'Measurement complete.', tone: 'success' }); } catch (error) { if (error?.name === 'AbortError') { setStatus({ message: 'Submission cancelled.' }); } else { setStatus({ message: error.message || 'Could not submit the measurement. Check your connection and try again.', tone: 'error', retryable: error?.retryable }); } } finally { requestAbort.current = null; setSubmitting(false); } };
  const cancelSubmit = () => requestAbort.current?.abort();
  const retake = (nextView) => { setCaptures((old) => ({ ...old, [nextView]: null })); setView(nextView); setResult(null); startCamera(); };
  return <main><header><p className="eyebrow">Guided capture</p><h1>Measure your arm</h1><p>It takes two photos. Keep your device fixed, fit your whole body in frame, and follow the prompts.</p><p className="privacy-note"><strong>Privacy:</strong> photos are used in memory for this measurement and are not saved by default.</p></header>
    <section className="card" aria-labelledby="details-heading"><h2 id="details-heading">Your details</h2><div className="fields"><label htmlFor="height"><span>Height (cm)</span><span className="field-help">Use your measured height for the best estimate.</span><input id="height" aria-label="Height (cm)" aria-describedby="height-help" type="number" min="1" max="300" step="0.1" value={height} onChange={(event) => setHeight(event.target.value)} required /><span id="height-help" className="sr-only">Enter a value between 1 and 300 centimeters.</span></label><label htmlFor="arm"><span>Arm to measure</span><span className="field-help">Choose the arm held slightly away from your body.</span><select id="arm" aria-label="Arm to measure" value={arm} onChange={(event) => setArm(event.target.value)}><option value="left">Left</option><option value="right">Right</option></select></label></div></section>
    <section className="card capture-card" aria-labelledby="capture-heading"><div className="capture-heading"><div><p className="eyebrow" id="stage">Step {stream ? (view === 'front' ? 2 : 3) : 1} of 3</p><h2 id="capture-heading">{title}</h2></div><span id="camera-status" className={`status-pill ${cameraStatus === 'Ready' ? 'ready' : ''}`} role="status" aria-live="polite">{cameraStatus}</span></div><div className="video-wrap"><video ref={video} autoPlay playsInline muted onLoadedMetadata={() => { video.current.play(); setReady(true); }} aria-label="Live camera preview" /><span className="framing-guide" aria-hidden="true" /></div><p id="instruction">{instruction}</p><p className="capture-tip">Camera access is needed only to take the two still images. No audio is requested.</p><div className="actions"><button id="start" type="button" disabled={Boolean(capturingView)} onClick={startCamera}>{stream ? 'Restart camera' : 'Allow camera'}</button><button id="capture" type="button" disabled={!stream || !ready || submitting || Boolean(capturingView)} onClick={captureView}>{capturingView ? `Capturing ${capturingView}… ${countdown}` : `Capture ${view}`}</button><button id="submit" type="button" disabled={!captures.front || !captures.side || submitting || Boolean(capturingView)} onClick={() => submit()}>{submitting ? 'Processing…' : 'Submit measurement'}</button>{submitting && <button id="cancel" type="button" onClick={cancelSubmit}>Cancel submission</button>}{!submitting && status.tone === 'error' && status.retryable && lastRequest && <button id="retry" type="button" onClick={() => submit(lastRequest)}>Retry</button>}</div><p id="status" role={status.tone === 'error' ? 'alert' : 'status'} aria-live="polite" data-tone={status.tone}>{status.message}</p></section>
    {result && <Result value={result} />}<section id="captures" className="card captures" aria-labelledby="captures-heading" hidden={!captures.front && !captures.side}><h2 id="captures-heading">Captured views</h2><div className="capture-grid">{['front', 'side'].map((name) => captures[name] && <figure key={name}><img className="capture-preview" alt={`${name} view preview`} src={URL.createObjectURL(captures[name])} /><figcaption>{name[0].toUpperCase() + name.slice(1)} view <button type="button" onClick={() => retake(name)}>Retake</button></figcaption></figure>)}</div></section><canvas ref={canvas} hidden /></main>;
}

if (document.getElementById('root')) createRoot(document.getElementById('root')).render(<App />);
