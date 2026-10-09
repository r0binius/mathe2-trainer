import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deferred } from './deferred';

const interval = 5 * 60 * 1000;

describe('deferred', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends only the newest value, once per interval', async () => {
    const send = vi.fn(() => Promise.resolve(true));
    const upload = deferred(send, interval);

    upload.schedule(1);
    upload.schedule(2);
    upload.schedule(3);
    await vi.advanceTimersByTimeAsync(interval - 1);

    expect(send).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(send).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('keeps sending during steady activity', async () => {
    const send = vi.fn(() => Promise.resolve(true));
    const upload = deferred(send, interval);

    upload.schedule(1);
    await vi.advanceTimersByTimeAsync(interval / 2);
    upload.schedule(2);
    await vi.advanceTimersByTimeAsync(interval / 2);

    expect(send).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('sends right away when flushed, and then not again', async () => {
    const send = vi.fn(() => Promise.resolve(true));
    const upload = deferred(send, interval);

    upload.schedule(1);
    await upload.flush();
    await upload.flush();
    await vi.advanceTimersByTimeAsync(interval * 2);

    expect(send).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('tries a value again that could not be sent', async () => {
    const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const upload = deferred(send, interval);

    upload.schedule(1);
    await upload.flush();
    await vi.advanceTimersByTimeAsync(interval);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith(1);
  });

  it('treats a throwing send as a failure', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(true);
    const upload = deferred(send, interval);

    upload.schedule(1);
    await upload.flush();
    await vi.advanceTimersByTimeAsync(interval);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('drops a failed value that a newer one replaced', async () => {
    const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const upload = deferred(send, interval);

    upload.schedule(1);
    await upload.flush();
    upload.schedule(2);
    await upload.flush();

    expect(send).toHaveBeenLastCalledWith(2);
    await vi.advanceTimersByTimeAsync(interval);

    expect(send).toHaveBeenCalledTimes(2);
  });
});
