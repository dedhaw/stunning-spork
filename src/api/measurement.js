export class MeasurementRequestError extends Error {
  constructor(message, { code = 'request_failed', status = 0, retryable = false } = {}) {
    super(message);
    this.name = 'MeasurementRequestError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function getErrorMessage(payload) {
  const detail = payload?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  if (Array.isArray(detail)) return 'Check the measurement details and try again.';
  return 'Processing failed. Try again.';
}

export function createRequestId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

async function readPayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestMeasurement({ front, side, height, arm, requestId = createRequestId(), signal, fetchImpl = fetch }) {
  const body = new FormData();
  body.append('front_image', front, 'front.jpg');
  body.append('side_image', side, 'side.jpg');
  body.append('height_cm', String(height));
  body.append('arm', arm);
  body.append('client_request_id', requestId);

  let response;
  try {
    response = await fetchImpl('/v1/measurements/arm-length', { method: 'POST', body, signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new MeasurementRequestError('Could not submit the measurement. Check your connection and try again.', { retryable: true });
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new MeasurementRequestError(getErrorMessage(payload), {
      code: payload?.detail?.code || 'request_failed',
      status: response.status,
      retryable: response.status >= 500 || response.status === 408,
    });
  }
  if (!payload || typeof payload !== 'object') {
    throw new MeasurementRequestError('The measurement service returned an invalid response.', { retryable: true });
  }
  return payload;
}
