import { afterEach, describe, expect, it, vi } from 'vitest';
import { trustResourceUrl, trustUrl } from '../trust-url/trust-url.util';
import { sanitizeResourceUrl, sanitizeUrl } from './sanitize-url.util';

describe('sanitizeUrl', () => {
  it('gives back a URL running no code', () => {
    expect(sanitizeUrl('/orders/42')).toBe('/orders/42');
    expect(sanitizeUrl('https://example.com/a?b#c')).toBe('https://example.com/a?b#c');
    expect(sanitizeUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(sanitizeUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('gives null for a URL running code, however it is written', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl(' \tJaVa\nScRiPt:alert(1)')).toBeNull();
    expect(sanitizeUrl('vbscript:x')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('gives back a URL the application trusts as it is', () => {
    expect(sanitizeUrl(trustUrl('javascript:void(0)'))).toBe('javascript:void(0)');
    expect(sanitizeUrl(trustResourceUrl('javascript:void(0)'))).toBe('javascript:void(0)');
  });
});

describe('sanitizeResourceUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('gives back a URL loading from the application, null for one of another origin or running code', () => {
    expect(sanitizeResourceUrl('/embed/42')).toBe('/embed/42');
    expect(sanitizeResourceUrl('https://evil.example.net/frame.html')).toBeNull();
    expect(sanitizeResourceUrl('//evil.example.net/frame.html')).toBeNull();
    expect(sanitizeResourceUrl('javascript:alert(1)')).toBeNull();
  });

  it('gives back a URL of the trusted origins of the project', async () => {
    vi.stubGlobal('__XAENDAR_SECURITY__', { urls: 'off', resourceUrls: 'off', trustedOrigins: ['https://cdn.example.com'], rejectUnsafeBindings: true });
    vi.resetModules();
    const { sanitizeResourceUrl: sanitize } = await import('./sanitize-url.util');

    expect(sanitize('https://cdn.example.com/frame.html')).toBe('https://cdn.example.com/frame.html');
    expect(sanitize('https://evil.example.net/frame.html')).toBeNull();
  });

  it('gives back a URL trusted as a resource as it is, and checks the origin of one trusted as a URL only', () => {
    expect(sanitizeResourceUrl(trustResourceUrl('https://evil.example.net/frame.html'))).toBe('https://evil.example.net/frame.html');
    expect(sanitizeResourceUrl(trustUrl('https://evil.example.net/frame.html'))).toBeNull();
    expect(sanitizeResourceUrl(trustUrl('/frame.html'))).toBe('/frame.html');
  });
});
