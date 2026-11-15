// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

// The namespace keeps the type of the symbol, which destructuring widens
const core = await import('@xaendar/core');
const { _resolveDirective, _setInput, CustomDirective } = core;
const { InnerHtmlDirective } = await import('./inner-html.directive');
const { trustHtml } = await import('../../utils/trust-html/trust-html.utils');

/**
 * Creates the directive applied to a new element, with the inputs given, as a template binds them.
 */
function apply(inputs: Record<string, unknown>): { directive: InstanceType<typeof InnerHtmlDirective>, element: HTMLElement } {
  const element = document.createElement('article');
  const directive = new InnerHtmlDirective();
  directive[core._SET_DIRECTIVE_ELEMENT] = element;
  for (const name in inputs) {
    setInput(directive, name, inputs[name]);
  }

  return { directive, element };
}

/**
 * Sets an input of the directive, as a template binding a literal does.
 */
function setInput(directive: InstanceType<typeof InnerHtmlDirective>, name: string, value: unknown): void {
  _setInput(undefined as never, directive, { name, value } as never);
}

/**
 * Lets the effects scheduled by a change run.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InnerHtmlDirective', () => {
  it('is the custom directive of the selector innerHtml', () => {
    expect(_resolveDirective('innerHtml', CustomDirective)).toBe(InnerHtmlDirective);
  });

  it('renders the HTML sanitized as it starts, and again when it changes', async () => {
    const { directive, element } = apply({ html: '<b onclick="x()">a</b>' });

    directive.onInit();
    expect(element.innerHTML).toBe('<b>a</b>');
    setInput(directive, 'html', '<i>b</i>');
    await flush();

    expect(element.innerHTML).toBe('<i>b</i>');
  });

  it('renders with the options, the sanitizer or the trust given', async () => {
    const { directive, element } = apply({ html: '<p style="color: red">a</p>', options: { allowAttributes: ['style'] } });

    directive.onInit();
    expect(element.innerHTML).toBe('<p style="color: red">a</p>');
    setInput(directive, 'html', trustHtml('<b onclick="go()">t</b>'));
    await flush();
    expect(element.innerHTML).toBe('<b onclick="go()">t</b>');
    setInput(directive, 'html', '<i>s</i>');
    setInput(directive, 'sanitizer', (html: string) => `${html}!`);
    await flush();

    expect(element.innerHTML).toBe('<i>s</i>!');
  });

  it('dispatches sanitized with what the sanitizer removed, only when it removed something', async () => {
    const { directive, element } = apply({ html: '<p>a</p>' });
    const listener = vi.fn();
    element.addEventListener('sanitized', listener);

    directive.onInit();
    expect(listener).not.toHaveBeenCalled();
    setInput(directive, 'html', '<p onclick="x()">a<script>s</script></p>');
    await flush();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual({ removedElements: ['script'], removedAttributes: ['p[onclick]'] });
  });

  it('writes the HTML at once on the server, where the effects do not run, without an effect, dispatching nothing', () => {
    const { directive, element } = apply({ html: '<b onclick="x()">a</b>' });
    const dispatch = vi.spyOn(element, 'dispatchEvent');
    const effect = vi.spyOn(directive, 'effect');
    vi.stubGlobal('window', undefined);

    directive.onInit();

    expect(element.innerHTML).toBe('<b>a</b>');
    expect(effect).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
