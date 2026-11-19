// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { _getComponentRuntime, _setComponentRuntime } from '../component-runtime/component-runtime.util';
import { _stringifyState } from '../state-serialization/state-serialization.util';
import { _readPageTransferState, getTransferState } from './transfer-state.util';

/**
 * Writes a transfer state into the page, as the server writes it.
 *
 * @param state - The transfer state.
 * @returns The script holding it.
 */
function writeState(state: Record<string, unknown>): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'application/json';
  script.setAttribute('data-xd-state', '');
  script.textContent = _stringifyState(state, 'state');
  document.body.appendChild(script);
  return script;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('getTransferState()', () => {
  it('reads the transfer state through the runtime in use', () => {
    const runtime = _getComponentRuntime();
    const read = vi.fn(() => 'server');
    const previous = _setComponentRuntime({ ...runtime, getTransferState: read });

    try {
      expect(getTransferState<string>('product')).toBe('server');
      expect(read).toHaveBeenCalledWith('product');
    } finally {
      _setComponentRuntime(previous);
    }
  });

  it('reads in the browser the transfer state the server wrote into the page', () => {
    writeState({ product: { id: 42, since: new Date(0) } });

    expect(getTransferState('product')).toEqual({ id: 42, since: new Date(0) });
  });
});

describe('_readPageTransferState()', () => {
  it('has no value when the page holds no transfer state, or none holds the key', () => {
    expect(_readPageTransferState('product')).toBeUndefined();

    writeState({ user: 'Ada' });
    const ignored = document.createElement('script');
    ignored.setAttribute('data-xd-state', '');
    ignored.textContent = 'not json';
    document.body.appendChild(ignored);

    expect(_readPageTransferState('product')).toBeUndefined();
  });

  it('gives the value of the first transfer state holding the key, an undefined one included', () => {
    writeState({ user: undefined });
    writeState({ user: 'Grace', product: 42 });

    expect(_readPageTransferState('user')).toBeUndefined();
    expect(_readPageTransferState('product')).toBe(42);
  });

  it('reads each transfer state once, returning the same value at every read', () => {
    const script = writeState({ product: { id: 42 } });
    const first = _readPageTransferState('product');
    script.textContent = _stringifyState({ product: { id: 43 } }, 'state');

    expect(_readPageTransferState('product')).toBe(first);
  });

  it('has no value outside a browser', () => {
    writeState({ product: 42 });
    vi.stubGlobal('document', undefined);

    expect(_readPageTransferState('product')).toBeUndefined();
  });
});
