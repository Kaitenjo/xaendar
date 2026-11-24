import { afterEach, describe, expect, it, vi } from 'vitest';
import { _checkUrl } from './url-check.util';

describe('_checkUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('passes the URLs running no code, and the values that are no URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const url = new URL('https://example.com/');

    expect(_checkUrl('href', '/path', 'remove')).toBe('/path');
    expect(_checkUrl('href', url, 'remove')).toBe(url);
    expect(_checkUrl('href', null, 'remove')).toBeNull();
    expect(_checkUrl('href', undefined, 'remove')).toBeUndefined();
    expect(_checkUrl('hidden', true, 'remove')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it('writes a URL running code with a warning, as "warn" asks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(_checkUrl('href', 'javascript:alert(1)', 'warn')).toBe('javascript:alert(1)');
    expect(warn).toHaveBeenCalledWith('Xaendar: the URL bound to href runs code (javascript:alert(1)): it is written as it is. Bind a URL of the application, or set "security": { "urls": "remove" } in xaendar.json to leave it out.');
  });

  it('leaves out a URL running code, as "remove" asks, with a warning in development only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(_checkUrl('src', 'data:text/html,<p>', 'remove')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Xaendar: the URL bound to src runs code (data:text/html,<p>): src is left out, as "security": { "urls": "remove" } in xaendar.json asks.');

    warn.mockClear();
    vi.stubGlobal('__XAENDAR_DEV__', false);
    vi.resetModules();
    const { _checkUrl: checkInProduction } = await import('./url-check.util');

    expect(checkInProduction('src', 'vbscript:x', 'remove')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});
