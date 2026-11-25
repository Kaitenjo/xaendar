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
async function load(): Promise<typeof import('./trusted-html.util')> {
  vi.resetModules();
  return import('./trusted-html.util');
}

describe('_toTrustedHtml', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gives the HTML itself where the browser does not support Trusted Types', async () => {
    const { _toTrustedHtml } = await load();

    expect(_toTrustedHtml('<b>a</b>', 'xaendar#template')).toBe('<b>a</b>');
  });

  it('gives a TrustedHTML of the policy, created once', async () => {
    const createPolicy = installTrustedTypes();
    const { _toTrustedHtml, TEMPLATE_CONTENT_POLICY } = await load();

    expect(_toTrustedHtml('<b>a</b>', TEMPLATE_CONTENT_POLICY)).toEqual(new FakeTrustedHtml('<b>a</b>', 'xaendar#template'));
    expect(_toTrustedHtml('<i>b</i>', TEMPLATE_CONTENT_POLICY)).toEqual(new FakeTrustedHtml('<i>b</i>', 'xaendar#template'));
    expect(createPolicy).toHaveBeenCalledOnce();
  });

  it('gives the HTML itself when the Content-Security-Policy does not allow the policy, trying to create it once', async () => {
    const createPolicy = installTrustedTypes(['xaendar#template']);
    const { _toTrustedHtml } = await load();

    expect(_toTrustedHtml('<b>a</b>', 'xaendar#template')).toBe('<b>a</b>');
    expect(_toTrustedHtml('<b>a</b>', 'xaendar#template')).toBe('<b>a</b>');
    expect(createPolicy).toHaveBeenCalledOnce();
  });
});
