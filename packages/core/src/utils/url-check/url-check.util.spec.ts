import { afterEach, describe, expect, it, vi } from 'vitest';
import { trustResourceUrl, trustUrl } from '../trust-url/trust-url.util';
import { _checkUrl, checkHostUrl } from './url-check.util';

/**
 * Loads the module again, with the security the plugin defines.
 */
async function loadWith(security: object): Promise<typeof import('./url-check.util')> {
  vi.stubGlobal('__XAENDAR_SECURITY__', security);
  vi.resetModules();
  return import('./url-check.util');
}

/**
 * The security of a project leaving out what is not safe.
 */
const REMOVING = { urls: 'remove', resourceUrls: 'remove', trustedOrigins: ['https://cdn.example.com'], rejectUnsafeBindings: true };

describe('_checkUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('passes the URLs running no code, and the values that are no URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const url = new URL('https://example.com/');

    expect(_checkUrl('href', '/path')).toBe('/path');
    expect(_checkUrl('href', url)).toBe(url);
    expect(_checkUrl('href', null)).toBeNull();
    expect(_checkUrl('href', undefined)).toBeUndefined();
    expect(_checkUrl('hidden', true)).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it('writes a URL running code with a warning by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(_checkUrl('href', 'javascript:alert(1)')).toBe('javascript:alert(1)');
    expect(warn).toHaveBeenCalledWith('Xaendar: the URL bound to href runs code (javascript:alert(1)): it is written as it is. Bind a URL of the application, or mark it with trustUrl() when the application trusts it, or set "security": { "urls": "remove" } in xaendar.json to leave it out.');
  });

  it('checks every image of a srcset and every URL of a ping', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { _checkUrl: check } = await loadWith(REMOVING);

    expect(check('srcset', 'a.png 1x, javascript:alert(1) 2x')).toBeNull();
    expect(check('PING', '/a javascript:alert(1)')).toBeNull();
    expect(check('srcset', 'a.png 1x, b.png 2x')).toBe('a.png 1x, b.png 2x');
  });

  it('leaves out a URL running code, as "remove" asks, with a warning in development only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { _checkUrl: check } = await loadWith(REMOVING);

    expect(check('src', 'data:text/html,<p>')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Xaendar: the URL bound to src runs code (data:text/html,<p>): src is left out, as "security": { "urls": "remove" } in xaendar.json asks.');

    warn.mockClear();
    vi.stubGlobal('__XAENDAR_DEV__', false);
    vi.resetModules();
    const { _checkUrl: checkInProduction } = await import('./url-check.util');

    expect(checkInProduction('src', 'vbscript:x')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('checks the origin of a resource the attribute loads, with a warning by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(_checkUrl('src', '/frame.html', true)).toBe('/frame.html');
    expect(_checkUrl('src', 'https://evil.com/frame.html')).toBe('https://evil.com/frame.html');
    expect(warn).not.toHaveBeenCalled();
    expect(_checkUrl('src', 'https://evil.com/frame.html', true)).toBe('https://evil.com/frame.html');
    expect(warn).toHaveBeenCalledWith('Xaendar: the URL bound to src loads a resource from an origin the application does not trust (https://evil.com/frame.html): it is written as it is. Bind a URL of the application, add its origin to "trustedOrigins", or mark it with trustResourceUrl() when the application trusts it, or set "security": { "resourceUrls": "remove" } in xaendar.json to leave it out.');
  });

  it('leaves out a resource of an origin that is not trusted, as "remove" asks, and trusts the trusted origins', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { _checkUrl: check } = await loadWith(REMOVING);

    expect(check('src', 'https://evil.com/frame.html', true)).toBeNull();
    expect(warn).toHaveBeenLastCalledWith('Xaendar: the URL bound to src loads a resource from an origin the application does not trust (https://evil.com/frame.html): src is left out, as "security": { "resourceUrls": "remove" } in xaendar.json asks.');
    expect(check('src', 'https://cdn.example.com/frame.html', true)).toBe('https://cdn.example.com/frame.html');
  });

  it('checks nothing the security of the project turns off', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { _checkUrl: check } = await loadWith({ urls: 'off', resourceUrls: 'off', trustedOrigins: [], rejectUnsafeBindings: true });

    expect(check('href', 'javascript:alert(1)')).toBe('javascript:alert(1)');
    expect(check('src', 'https://evil.com/frame.html', true)).toBe('https://evil.com/frame.html');
    expect(warn).not.toHaveBeenCalled();
  });

  it('passes the URLs the application trusts, a URL trusted with trustUrl still checked where it loads a resource', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { _checkUrl: check } = await loadWith(REMOVING);
    const { trustResourceUrl: trustResource, trustUrl: trust } = await import('../trust-url/trust-url.util');
    const link = trust('javascript:void(0)');
    const frame = trustResource('https://evil.com/frame.html');

    expect(check('href', link)).toBe(link);
    expect(check('src', frame, true)).toBe(frame);
    expect(check('src', trust('https://evil.com/frame.html'), true)).toBeNull();
  });

  it('passes the URLs trusted with the default security', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const link = trustUrl('javascript:void(0)');
    const frame = trustResourceUrl('https://evil.com/frame.html');

    expect(_checkUrl('href', link)).toBe(link);
    expect(_checkUrl('src', frame, true)).toBe(frame);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('checkHostUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('checks the URLs a host attribute writes, as the security of the project asks', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const frame = { localName: 'iframe' } as Element;

    expect(checkHostUrl(frame, 'src', 'https://evil.com/frame.html')).toBe('https://evil.com/frame.html');
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(checkHostUrl(frame, 'title', 'javascript:x')).toBe('javascript:x');
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('follows the security the plugin defines', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const frame = { localName: 'iframe' } as Element;

    const removing = await loadWith(REMOVING);
    expect(removing.checkHostUrl(frame, 'src', 'https://evil.com/frame.html')).toBeNull();
    expect(removing.checkHostUrl({ localName: 'a' } as Element, 'HREF', 'javascript:x')).toBeNull();
    expect(removing.checkHostUrl({ localName: 'a' } as Element, 'href', 'https://evil.com/')).toBe('https://evil.com/');

    const off = await loadWith({ urls: 'off', resourceUrls: 'off', trustedOrigins: [], rejectUnsafeBindings: true });
    expect(off.checkHostUrl(frame, 'src', 'javascript:x')).toBe('javascript:x');
  });
});
