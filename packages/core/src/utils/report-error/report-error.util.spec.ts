import { describe, expect, it, vi } from 'vitest';
import { reportError } from './report-error.util';

describe('reportError', () => {
  it('throws the error again in a microtask, not at once', () => {
    const queue = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(() => undefined);
    const error = new Error('boom');

    expect(() => reportError(error)).not.toThrow();
    expect(queue).toHaveBeenCalledOnce();
    expect(() => queue.mock.calls[0][0]()).toThrow(error);
    queue.mockRestore();
  });
});
