import { afterEach, describe, expect, it, vi } from 'vitest';

describe('SECURITY', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('applies the defaults of xaendar.json where nothing defines the security of the project, as in the tests', async () => {
    expect((await import('./security.util')).SECURITY).toEqual({ urls: 'remove', resourceUrls: 'remove', trustedOrigins: [], rejectUnsafeBindings: true });
  });

  it('applies the security the plugin defines', async () => {
    const security = { urls: 'remove', resourceUrls: 'off', trustedOrigins: ['https://a.b'], rejectUnsafeBindings: false };
    vi.stubGlobal('__XAENDAR_SECURITY__', security);
    vi.resetModules();

    expect((await import('./security.util')).SECURITY).toBe(security);
  });
});
