// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * A `TrustedHTML` of the fake Trusted Types of these specs: the HTML and the name of the policy that created it.
 */
class FakeTrustedHtml {
  public constructor(public readonly html: string, public readonly policy: string) {}

  public toString(): string {
    return this.html;
  }
}

/**
 * Installs a fake `trustedTypes`, refusing the policies named in `refused`, and returns the HTML each policy created.
 */
function installTrustedTypes(refused: string[] = []): { createPolicy: ReturnType<typeof vi.fn> } {
  const createPolicy = vi.fn((name: string, rules: { createHTML(html: string): string }) => {
    if (refused.includes(name)) {
      throw new TypeError(`Policy ${name} disallowed`);
    }

    return { createHTML: (html: string) => new FakeTrustedHtml(rules.createHTML(html), name) };
  });
  vi.stubGlobal('trustedTypes', { createPolicy });
  return { createPolicy };
}

/**
 * Loads the modules again, so that they create their policies again, with the trustHtml of the same copy of SAFE_HTML.
 */
async function load(): Promise<typeof import('./inner-html.utils') & typeof import('../trust-html/trust-html.utils')> {
  vi.resetModules();
  return Object.assign({}, await import('./inner-html.utils'), await import('../trust-html/trust-html.utils'));
}

/**
 * An element recording what its `innerHTML` is assigned.
 */
function recordingElement(): { element: Element, assigned: unknown[] } {
  const assigned = new Array<unknown>();
  const element = { set innerHTML(value: unknown) { assigned.push(value); } } as unknown as Element;
  return { element, assigned };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('renderHtml', () => {
  it('renders the HTML sanitized, and returns what was removed', async () => {
    const { renderHtml } = await load();
    const element = document.createElement('div');
    element.innerHTML = '<span>old</span>';

    const report = renderHtml(element, '<b onclick="x()">a</b><script>s</script>', undefined, undefined);

    expect(element.innerHTML).toBe('<b>a</b>');
    expect(report).toEqual({ removedElements: ['script'], removedAttributes: ['b[onclick]'] });
  });

  it('sanitizes with the options given', async () => {
    const { renderHtml } = await load();
    const element = document.createElement('div');

    expect(renderHtml(element, '<p style="color: red">a</p>', { allowAttributes: ['style'] }, undefined)).toBeUndefined();
    expect(element.innerHTML).toBe('<p style="color: red">a</p>');
  });

  it('empties the element for null and undefined', async () => {
    const { renderHtml } = await load();
    const element = document.createElement('div');
    element.innerHTML = 'old';

    renderHtml(element, null, undefined, undefined);
    expect(element.innerHTML).toBe('');
    element.innerHTML = 'old';
    renderHtml(element, undefined, undefined, undefined);
    expect(element.innerHTML).toBe('');
  });

  it('renders an HTML trusted as it is', async () => {
    const { renderHtml, trustHtml } = await load();
    const element = document.createElement('div');

    expect(renderHtml(element, trustHtml('<b onclick="go()">a</b>'), undefined, undefined)).toBeUndefined();
    expect(element.innerHTML).toBe('<b onclick="go()">a</b>');
  });

  it('renders what the sanitizer given returns, in place of its own, the options aside', async () => {
    const { renderHtml } = await load();
    const element = document.createElement('div');
    const sanitizer = vi.fn((html: string) => `${html}<i>!</i>`);

    expect(renderHtml(element, '<b onclick="go()">a</b>', { allowElements: ['x'] }, sanitizer)).toBeUndefined();
    expect(sanitizer).toHaveBeenCalledExactlyOnceWith('<b onclick="go()">a</b>');
    expect(element.innerHTML).toBe('<b onclick="go()">a</b><i>!</i>');
    renderHtml(element, null, undefined, sanitizer);
    expect(sanitizer).toHaveBeenCalledOnce();
    expect(element.innerHTML).toBe('');
  });

  it('writes a TrustedHTML of the policy of the HTML sanitized, or of the one of the HTML not sanitized', async () => {
    const { createPolicy } = installTrustedTypes();
    const { renderHtml, trustHtml, SANITIZED_HTML_POLICY, UNSANITIZED_HTML_POLICY } = await load();
    const { element, assigned } = recordingElement();

    renderHtml(element, '<b onclick="x()">a</b>', undefined, undefined);
    renderHtml(element, trustHtml('<i>t</i>'), undefined, undefined);
    renderHtml(element, 'c', undefined, html => html);
    renderHtml(element, 'd', undefined, undefined);

    expect(assigned).toEqual([
      new FakeTrustedHtml('<b>a</b>', SANITIZED_HTML_POLICY),
      new FakeTrustedHtml('<i>t</i>', UNSANITIZED_HTML_POLICY),
      new FakeTrustedHtml('c', UNSANITIZED_HTML_POLICY),
      new FakeTrustedHtml('d', SANITIZED_HTML_POLICY)
    ]);
    // Each policy is created once
    expect(createPolicy.mock.calls.map(([name]) => name)).toEqual([SANITIZED_HTML_POLICY, UNSANITIZED_HTML_POLICY]);
  });

  it('writes a string when the Content-Security-Policy does not allow the policy, trying to create it once', async () => {
    const { createPolicy } = installTrustedTypes(['xaendar#inner-html-unsafe']);
    const { renderHtml, trustHtml, SANITIZED_HTML_POLICY } = await load();
    const { element, assigned } = recordingElement();

    renderHtml(element, trustHtml('<i>t</i>'), undefined, undefined);
    renderHtml(element, trustHtml('<i>u</i>'), undefined, undefined);
    renderHtml(element, 'a', undefined, undefined);

    expect(assigned).toEqual(['<i>t</i>', '<i>u</i>', new FakeTrustedHtml('a', SANITIZED_HTML_POLICY)]);
    expect(createPolicy).toHaveBeenCalledTimes(2);
  });
});
