// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('../context/context.util');
const { _parameter, _renderTemplate, _template } = await import('./template.util');
const { computed, effect, signal } = await import('../../signals');

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

type Context = InstanceType<typeof _Context>;

function createRoot() {
  return new _Context({ createElement: (tag: string) => document.createElement(tag) } as never);
}

/**
 * Creates a template rendering a `<span>` reading its parameters, as the generated code does.
 */
function createTemplate(declarationContext: Context) {
  const render = vi.fn((parentNode: Element, parentContext: Context, referenceNode: Comment | null, params: Array<() => unknown>) => {
    const context = new _Context(parentContext);
    const span = document.createElement('span');
    span.textContent = params.map(param => param()).join(' ');
    mountNode(span, parentNode, context, referenceNode);
    return context;
  });

  return { render, template: _template(declarationContext, render) };
}

describe('_template', () => {
  it('holds the context of the scope declaring the template and the function rendering it', () => {
    const context = createRoot();
    const render = vi.fn();
    expect(_template(context, render)).toEqual({ context, render });
  });
});

describe('_parameter', () => {
  it('is the signal of the argument when the @render passes it, also as undefined', () => {
    const params = [computed(() => 'a'), computed(() => undefined)];

    expect(_parameter(params, 0, () => 'default')).toBe(params[0]);
    expect(_parameter(params, 1, () => 'default')).toBe(params[1]);
  });

  it('is the signal of the default value when the @render leaves the argument out, read again when what it reads changes', () => {
    const label = signal('a');
    const param = _parameter([], 0, () => `${label()}!`);

    expect(param()).toBe('a!');
    label.set('b');
    expect(param()).toBe('b!');
  });

  it('holds undefined for an optional parameter left out', () => {
    expect(_parameter([computed(() => 1)], 1)()).toBeUndefined();
  });
});

describe('_renderTemplate', () => {
  it('renders an instance before the reference node, in the context of the scope declaring the template, owned by the rendering one', () => {
    const declarationContext = createRoot();
    const renderingContext = new _Context(declarationContext);
    const { render, template } = createTemplate(declarationContext);
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.append(anchor);

    _renderTemplate(parent, renderingContext, anchor, template, [() => 'a', () => 1]);

    expect(parent.innerHTML).toBe('<span>a 1</span><!--anchor-->');
    expect(render).toHaveBeenCalledWith(parent, declarationContext, anchor, [expect.any(Function), expect.any(Function)]);
    const [instance] = renderingContext.getChildren();
    renderingContext.clear();
    expect(instance.getNodes()).toEqual([]);
    expect(parent.innerHTML).toBe('<!--anchor-->');
  });

  it('turns each argument into a signal, which reads the argument again when what it reads changes', () => {
    const declarationContext = createRoot();
    const label = signal('a');
    let param!: () => unknown;
    const template = _template(declarationContext, (_parentNode, parentContext, _referenceNode, params) => {
      [param] = params;
      return new _Context(parentContext);
    });

    _renderTemplate(document.createElement('div'), declarationContext, null, template, [() => `${label()}!`]);

    expect(param()).toBe('a!');
    label.set('b');
    expect(param()).toBe('b!');
  });

  it('does not make the signals read while rendering the instance dependencies of the code rendering it', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    const { template } = createTemplate(declarationContext);
    const renders = vi.fn();
    const stop = effect(() => {
      renders();
      _renderTemplate(document.createElement('div'), declarationContext, null, template, [() => label()]);
    });

    label.set('b');
    await flush();
    stop();
    expect(renders).toHaveBeenCalledTimes(1);
  });
});
