import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
import { App, Result, getErrorMessage, requestMeasurement } from './main.jsx';

describe('measurement app', () => {
  it('renders the setup state and details controls', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Measure your arm' })).toBeInTheDocument();
    expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow camera' })).toBeInTheDocument();
  });

  it('shows camera capability feedback', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: 'Allow camera' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Camera access is not supported');
  });

  it('counts down, captures a preview, and advances from front to side', async () => {
    vi.useFakeTimers();
    const stream = { getTracks: () => [] };
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) } });
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:preview') });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['capture'], { type: 'image/jpeg' })));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Allow camera' }));
    await act(async () => {});
    const video = screen.getByLabelText('Live camera preview');
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 640 });
    fireEvent.loadedMetadata(video);
    fireEvent.click(screen.getByRole('button', { name: 'Capture front' }));
    expect(document.getElementById('status')).toHaveTextContent('Capturing front in 3');

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(document.getElementById('status')).toHaveTextContent('Capturing front in 1');
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(document.getElementById('status')).toHaveTextContent(/Front view captured/);
    expect(screen.getByAltText('front view preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture side' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Capture front' })).toBeInTheDocument();
    expect(screen.queryByAltText('front view preview')).not.toBeInTheDocument();
  });

  it('exposes accessible guidance and live camera status', () => {
    render(<App />);
    expect(screen.getByLabelText('Height (cm)')).toHaveAttribute('aria-describedby', 'height-help');
    expect(screen.getByText('Not started')).toHaveAttribute('role', 'status');
    expect(screen.getByText(/photos are used in memory/i)).toBeInTheDocument();
  });

  it('renders result details and the accuracy caveat', () => {
    render(<Result value={{ value_cm: 68.4, confidence: 0.91, quality_status: 'good', quality_flags: [], client_request_id: 'demo-1', model_version: 'pose-1', algorithm_version: 'arm-2' }} />);
    expect(screen.getByRole('heading', { name: /68.4 cm/ })).toBeInTheDocument();
    expect(screen.getByText(/guide, not a guarantee/i)).toBeInTheDocument();
    expect(screen.getByText('pose-1')).toBeInTheDocument();
  });

  it('reads structured API errors', () => {
    expect(getErrorMessage({ detail: { message: 'Bad pose' } })).toBe('Bad pose');
    expect(getErrorMessage({})).toBe('Processing failed. Try again.');
  });

  it('builds the documented multipart request and returns measurement metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ value_cm: 72.4, confidence: 0.9 }) });
    await requestMeasurement({ front: new Blob(['front']), side: new Blob(['side']), height: 180, arm: 'right', requestId: 'test-request', fetchImpl: fetchMock });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body.get('height_cm')).toBe('180');
    expect(options.body.get('arm')).toBe('right');
    expect(options.body.get('client_request_id')).toBe('test-request');
    expect(options.body.get('front_image')).toBeInstanceOf(Blob);
  });

  it('handles structured, validation, non-json, and network errors safely', async () => {
    await expect(requestMeasurement({ front: new Blob(), side: new Blob(), height: 180, arm: 'left', fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: { code: 'bad_pose', message: 'Bad pose' } }) }) })).rejects.toMatchObject({ message: 'Bad pose', code: 'bad_pose' });
    await expect(requestMeasurement({ front: new Blob(), side: new Blob(), height: 180, arm: 'left', fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not json'); } }) })).rejects.toMatchObject({ message: 'Processing failed. Try again.', retryable: true });
    await expect(requestMeasurement({ front: new Blob(), side: new Blob(), height: 180, arm: 'left', fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) })).rejects.toMatchObject({ message: 'Could not submit the measurement. Check your connection and try again.', retryable: true });
  });

  it('passes cancellation through to fetch', async () => {
    const controller = new AbortController();
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const fetchMock = vi.fn().mockRejectedValue(abort);
    await expect(requestMeasurement({ front: new Blob(), side: new Blob(), height: 180, arm: 'left', signal: controller.signal, fetchImpl: fetchMock })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
