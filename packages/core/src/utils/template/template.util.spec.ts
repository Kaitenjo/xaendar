// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('../context/context.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _parameter, _renderTemplate, _template } = await import('./template.util');
const { _bindEffect } = await import('../../signals/effect/effect');
const { effect, signal } = await import('../../signals');

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

type Context = InstanceType<typeof _Context>;

function createRoot() {
  return new _Context({ createElement: (tag: string) => document.createElement(tag) } as never);
}

/**
 * Creates a template declaring the parameters `label` and `count`, rendering a `<span>` whose text reads them through a
 * binding of the instance, as the generated code does.
 */
function createTemplate(declarationContext: Context) {
  const instances = new Array<Context>();
  const render = vi.fn((parentNode: Element, parentContext: Context, referenceNode: Comment | null, params: unknown[]) => {
    const context = new _Context(parentContext, undefined, 2);
    context.addIdentifier('label', params[0]);
    context.addIdentifier('count', params[1]);
    instances.push(context);
    const span = document.createElement('span');
    mountNode(span, parentNode, context, referenceNode);
    _bindEffect(context, (scope: Context) => { span.textContent = `${scope.get('label')} ${scope.get('count')}`; }, context, undefined, undefined, ['label', 'count']);
    return context;
  });

  return { render, instances, template: _template(declarationContext, render, ['label', 'count']) };
}

describe('_template', () => {
  it('holds the context of the scope declaring the template, the function rendering it and the names of its parameters', () => {
    const context = createRoot();
    const render = vi.fn();
    expect(_template(context, render, ['item'])).toEqual({ context, render, parameters: ['item'] });
  });
});

describe('_parameter', () => {
  it('declares the value of the argument when the @render passes it, also as undefined', () => {
    const context = new _Context(createRoot(), undefined, 2);
    _parameter(context, ['a', undefined], 0, 'first', () => 'default');
    _parameter(context, ['a', undefined], 1, 'second', () => 'default');

    expect(context.get('first')).toBe('a');
    expect(context.get('second')).toBeUndefined();
  });

  it('declares the default value when the @render leaves the argument out, computed again when a parameter it reads changes', () => {
    const context = new _Context(createRoot(), undefined, 2);
    context.addIdentifier('item', 'a');
    _parameter(context, ['a'], 1, 'label', () => `${context.get('item')}!`, ['item']);
    expect(context.get('label')).toBe('a!');

    context.update('item', 'b');
    context.refresh(['item']);

    expect(context.get('label')).toBe('b!');
  });

  it('computes the default value again when a signal it reads changes', async () => {
    const suffix = signal('!');
    const context = new _Context(createRoot(), undefined, 1);
    _parameter(context, [], 0, 'label', () => `a${suffix()}`);

    suffix.set('?');
    await flush();

    expect(context.get('label')).toBe('a?');
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
    expect(render).toHaveBeenCalledWith(parent, declarationContext, anchor, ['a', 1], CREATE_NODES);
    const [instance] = renderingContext.getChildren()!;
    renderingContext.clear();
    expect(instance.getNodes()).toBeNull();
    expect(parent.innerHTML).toBe('<!--anchor-->');
  });

  it('passes over the separator the server wrote before the instance, once', () => {
    const declarationContext = createRoot();
    const { template } = createTemplate(declarationContext);
    const separator = vi.spyOn(CREATE_NODES, 'separator');

    _renderTemplate(document.createElement('div'), declarationContext, null, template, [() => 'a', () => 1], true);

    expect(separator).toHaveBeenCalledExactlyOnceWith(expect.any(HTMLDivElement), true);
    separator.mockRestore();
  });

  it('updates the parameters of the instance when an argument reading a signal changes, instead of rendering it again', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    const { render, instances, template } = createTemplate(declarationContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, declarationContext, null, template, [() => label(), () => 1]);
    const refresh = vi.spyOn(instances[0], 'refresh');

    label.set('b');
    await flush();

    expect(render).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledExactlyOnceWith(['label']);
    expect(parent.innerHTML).toBe('<span>b 1</span>');
  });

  it('updates the parameters of the instance when its scope is refreshed with a variable an argument reads', () => {
    const declarationContext = createRoot();
    const rowContext = new _Context(declarationContext, undefined, 1);
    rowContext.addIdentifier('row', { name: 'a', count: 1 });
    const { render, template } = createTemplate(declarationContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, rowContext, null, template, [() => (rowContext.get('row') as { name: string }).name, () => (rowContext.get('row') as { count: number }).count], false, ['row']);
    rowContext.update('row', { name: 'b', count: 1 });
    rowContext.refresh(['row']);

    expect(render).toHaveBeenCalledOnce();
    expect(parent.innerHTML).toBe('<span>b 1</span>');
  });

  it('refreshes the instance once with the names of every parameter whose argument changed', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    const count = signal(1);
    const { instances, template } = createTemplate(declarationContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, declarationContext, null, template, [() => label(), () => count()]);
    const refresh = vi.spyOn(instances[0], 'refresh');

    label.set('b');
    count.set(2);
    await flush();

    expect(refresh).toHaveBeenCalledExactlyOnceWith(['label', 'count']);
    expect(parent.innerHTML).toBe('<span>b 2</span>');
  });

  it('does not refresh the instance when the arguments computed again keep their values', () => {
    const declarationContext = createRoot();
    const rowContext = new _Context(declarationContext, undefined, 1);
    rowContext.addIdentifier('row', { name: 'a' });
    const { instances, template } = createTemplate(declarationContext);

    _renderTemplate(document.createElement('div'), rowContext, null, template, [() => (rowContext.get('row') as { name: string }).name], false, ['row']);
    const refresh = vi.spyOn(instances[0], 'refresh');
    rowContext.update('row', { name: 'a' });
    rowContext.refresh(['row']);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not make the signals read while rendering the instance dependencies of the code rendering it', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    const { template } = createTemplate(declarationContext);
    const renders = vi.fn();
    const stop = effect(() => {
      renders();
      _renderTemplate(document.createElement('div'), declarationContext, null, template, [() => 'x', () => label()]);
    });

    label.set('b');
    await flush();
    stop();
    expect(renders).toHaveBeenCalledTimes(1);
  });
});
