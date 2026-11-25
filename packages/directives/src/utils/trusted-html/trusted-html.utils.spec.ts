import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * A `TrustedHTML` of the fake Trusted Types of these specs: the HTML and the name of the policy that created it.
 */
class FakeTrustedHtml {
  public constructor(public readonly html: string, public readonly policy: string) {}
}

/**
 * Installs a fake `trustedTypes`, refusing the policies named in `refused`.
 */
function installTrustedTypes(refused: string[] = []): ReturnType<typeof vi.fn> {
  const createPolicy = vi.fn((name: string, rules: { createHTML(html: string): string }) => {
    if (refused.includes(name)) {
      throw new TypeError(`Policy ${name} disallowed`);
    }

    return { createHTML: (html: string) => new FakeTrustedHtml(rules.createHTML(html), name) };
  });
  vi.stubGlobal('trustedTypes', { createPolicy });
  return createPolicy;
}

/**
 * Loads the module again, so that it creates its policies again.
 */
async function load(): Promise<typeof import('./trusted-html.utils')> {
  vi.resetModules();
  return import('./trusted-html.utils');
}

describe('toTrustedHtml', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gives the HTML itself where the browser does not support Trusted Types', async () => {
    const { toTrustedHtml } = await load();

    expect(toTrustedHtml('<b>a</b>', 'xaendar#inner-html')).toBe('<b>a</b>');
  });

  it('gives a TrustedHTML of the policy, created once', async () => {
    const createPolicy = installTrustedTypes();
    const { toTrustedHtml } = await load();

    expect(toTrustedHtml('<b>a</b>', 'xaendar#inner-html')).toEqual(new FakeTrustedHtml('<b>a</b>', 'xaendar#inner-html'));
    expect(toTrustedHtml('<i>b</i>', 'xaendar#inner-html')).toEqual(new FakeTrustedHtml('<i>b</i>', 'xaendar#inner-html'));
    expect(createPolicy).toHaveBeenCalledOnce();
  });

  it('gives the HTML itself when the Content-Security-Policy does not allow the policy, trying to create it once', async () => {
    const createPolicy = installTrustedTypes(['xaendar#inner-html']);
    const { toTrustedHtml } = await load();

    expect(toTrustedHtml('<b>a</b>', 'xaendar#inner-html')).toBe('<b>a</b>');
    expect(toTrustedHtml('<b>a</b>', 'xaendar#inner-html')).toBe('<b>a</b>');
    expect(createPolicy).toHaveBeenCalledOnce();
  });
});
