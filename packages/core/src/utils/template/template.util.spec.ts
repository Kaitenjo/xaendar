// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { RenderTemplateConfig } from '../../types/render-template-config.type';
import type { _Template } from '../../types/template.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('../context/context.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _parameter, _renderTemplate } = await import('./template.util');
const { _bindEffect } = await import('../../signals/effect/effect');
const { effect, signal } = await import('../../signals');

/**
 * The nodes a context tracks, in mount order.
 */
const nodesOf = (context: { getNodeCount(): number, getNode(index: number): Node }): Node[] => Array.from({ length: context.getNodeCount() }, (_item, index) => context.getNode(index));

/**
 * The child contexts of a context, in registration order.
 */
const childrenOf = <TContext>(context: { getChildCount(): number, getChild(index: number): TContext }): TContext[] => Array.from({ length: context.getChildCount() }, (_item, index) => context.getChild(index));

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

type Context = InstanceType<typeof _Context>;

function createRoot() {
  return new _Context({ createElement: (tag: string) => document.createElement(tag) } as never);
}

/**
 * Creates a template `row` declaring the parameters `label` and `count`, rendering a `<span>` whose text reads them
 * through a binding of the instance, and declares it in a scope, as the generated code does.
 */
function createTemplate(declarationContext: Context) {
  const instances = new Array<Context>();
  const render = vi.fn((parentNode: Element, parentContext: Context, referenceNode: Comment | null, params: readonly unknown[]) => {
    const context = new _Context(parentContext, undefined, 2);
    context.addIdentifier('label', params[0]);
    context.addIdentifier('count', params[1]);
    instances.push(context);
    const span = document.createElement('span');
    mountNode(span, parentNode, context, referenceNode);
    _bindEffect(context, (scope: Context) => { span.textContent = `${scope.get('label')} ${scope.get('count')}`; }, context, undefined, undefined, ['label', 'count']);
    return context;
  });

  const template: _Template = { render, parameters: ['label', 'count'] };
  declarationContext.addIdentifier('row', template);
  return { render, instances, template };
}

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
    const { render } = createTemplate(declarationContext);
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.append(anchor);

    _renderTemplate(parent, renderingContext, anchor, { template: 'row', args: () => ['a', 1] });

    expect(parent.innerHTML).toBe('<span>a 1</span><!--anchor-->');
    expect(render).toHaveBeenCalledWith(parent, declarationContext, anchor, ['a', 1], CREATE_NODES);
    const [instance] = childrenOf(renderingContext);
    renderingContext.clear();
    expect(nodesOf(instance)).toEqual([]);
    expect(parent.innerHTML).toBe('<!--anchor-->');
  });

  it('passes over the separator the server wrote before the instance, once', () => {
    const declarationContext = createRoot();
    createTemplate(declarationContext);
    const separator = vi.spyOn(CREATE_NODES, 'separator');

    _renderTemplate(document.createElement('div'), declarationContext, null, { template: 'row', args: () => ['a', 1], separated: true });

    expect(separator).toHaveBeenCalledExactlyOnceWith(expect.any(HTMLDivElement), true);
    separator.mockRestore();
  });

  it('updates the parameters of the instance when an argument reading a signal changes, instead of rendering it again', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    const { render, instances } = createTemplate(declarationContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, declarationContext, null, { template: 'row', args: () => [label(), 1] });
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
    rowContext.addIdentifier('item', { name: 'a', count: 1 });
    const { render } = createTemplate(declarationContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, rowContext, null, { template: 'row', args: scope => [(scope.get('item') as { name: string }).name, (scope.get('item') as { count: number }).count], reads: ['item'] });
    rowContext.update('item', { name: 'b', count: 1 });
    rowContext.refresh(['item']);

    expect(render).toHaveBeenCalledOnce();
    expect(parent.innerHTML).toBe('<span>b 1</span>');
  });

  it('refreshes the instance once with the names of every parameter whose argument changed', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    const count = signal(1);
    const { instances } = createTemplate(declarationContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, declarationContext, null, { template: 'row', args: () => [label(), count()] });
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
    rowContext.addIdentifier('item', { name: 'a' });
    const { instances } = createTemplate(declarationContext);

    _renderTemplate(document.createElement('div'), rowContext, null, { template: 'row', args: scope => [(scope.get('item') as { name: string }).name], reads: ['item'] });
    const refresh = vi.spyOn(instances[0], 'refresh');
    rowContext.update('item', { name: 'a' });
    rowContext.refresh(['item']);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not make the signals read while rendering the instance dependencies of the code rendering it', async () => {
    const declarationContext = createRoot();
    const label = signal('a');
    createTemplate(declarationContext);
    const renders = vi.fn();
    const stop = effect(() => {
      renders();
      _renderTemplate(document.createElement('div'), declarationContext, null, { template: 'row', args: () => ['x', label()] });
    });

    label.set('b');
    await flush();
    stop();
    expect(renders).toHaveBeenCalledTimes(1);
  });

  it('renders the instances of a @render passing no argument with the same frozen empty array', () => {
    const declarationContext = createRoot();
    const { render } = createTemplate(declarationContext);
    const config: RenderTemplateConfig = { template: 'row' };

    _renderTemplate(document.createElement('div'), declarationContext, null, config);
    _renderTemplate(document.createElement('div'), new _Context(declarationContext), null, config);

    const [firstValues, secondValues] = render.mock.calls.map(call => call[3]);
    expect(firstValues).toEqual([]);
    expect(Object.isFrozen(firstValues)).toBe(true);
    expect(secondValues).toBe(firstValues);
  });

  it('renders the instance from a nested scope as a child of the scope declaring the template, whose names its content reads', () => {
    const declarationContext = new _Context(createRoot(), undefined, 2);
    declarationContext.addIdentifier('title', 'declared');
    createTemplate(declarationContext);
    const middleContext = new _Context(declarationContext, undefined, 1);
    middleContext.addIdentifier('title', 'shadowed');
    const renderingContext = new _Context(middleContext);
    const parent = document.createElement('div');

    _renderTemplate(parent, renderingContext, null, { template: 'row', args: () => ['a', 1] });

    const [instance] = childrenOf(renderingContext);
    expect(instance.get('title')).toBe('declared');
    expect(instance.ownerOf('title')).toBe(declarationContext);
    expect(instance.ownerOf('row')).toBe(declarationContext);
    expect(parent.innerHTML).toBe('<span>a 1</span>');
  });

  it('throws a ReferenceError when no scope declares the template', () => {
    expect(() => _renderTemplate(document.createElement('div'), createRoot(), null, { template: 'row' })).toThrow(new ReferenceError('"row" is not declared in this scope'));
  });

  it('calls the arguments with the component of the context as this and the context', () => {
    const component = { label: 'a' };
    const declarationContext = new _Context(createRoot(), undefined, 1, component);
    createTemplate(declarationContext);
    const args = vi.fn(function (this: typeof component, _context: Context) {
      return [this.label, 1];
    });
    const parent = document.createElement('div');

    _renderTemplate(parent, declarationContext, null, { template: 'row', args });

    expect(parent.innerHTML).toBe('<span>a 1</span>');
    expect(args.mock.contexts[0]).toBe(component);
    expect(args.mock.calls[0][0]).toBe(declarationContext);
  });

  it('shares the same config and the same arguments between two instances of the @render, each reading its own context, without writing into the config', () => {
    const declarationContext = createRoot();
    const { render } = createTemplate(declarationContext);
    const args = vi.fn((scope: Context) => [scope.get('item'), 1]);
    const config: RenderTemplateConfig = Object.freeze({ template: 'row', args, separated: false, reads: Object.freeze(['item']) });
    const first = new _Context(declarationContext, undefined, 1);
    const second = new _Context(declarationContext, undefined, 1);
    first.addIdentifier('item', 'a');
    second.addIdentifier('item', 'b');
    const firstParent = document.createElement('div');
    const secondParent = document.createElement('div');

    _renderTemplate(firstParent, first, null, config);
    _renderTemplate(secondParent, second, null, config);
    second.update('item', 'c');
    second.refresh(['item']);

    const scopes = new Map([[first, 'first'], [second, 'second']]);
    expect(firstParent.innerHTML).toBe('<span>a 1</span>');
    expect(secondParent.innerHTML).toBe('<span>c 1</span>');
    expect(args.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'second', 'second']);
    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls.map(call => call[1] === declarationContext)).toEqual([true, true]);
  });
});
