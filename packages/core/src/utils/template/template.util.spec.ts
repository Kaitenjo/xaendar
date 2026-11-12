// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { HEADER, LAYOUT } from '../../costants';
import type { _Context } from '../../types/context.type';
import type { RenderTemplateConfig } from '../../types/render-template-config.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import type { _Template } from '../../types/template.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _read, _scope, clear, EMPTY_LAYOUT, getChild, getChildCount, mountNode, refresh, update } = await import('../context/context.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _parameter, _renderTemplate } = await import('./template.util');
const { _bindEffect } = await import('../../signals/effect/effect');
const { effect, signal } = await import('../../signals');

/**
 * The nodes a context tracks, in the order of their slots.
 */
const nodesOf = (context: _Context): Node[] => context.slice(context[LAYOUT].nodes).filter(Boolean) as Node[];

/**
 * The child contexts of a context, in registration order.
 */
const childrenOf = (context: _Context): _Context[] => Array.from({ length: getChildCount(context) }, (_item, index) => getChild(context, index));

/**
 * The layout of a scope declaring the variables named.
 */
const layoutOf = (...variables: string[]): _ScopeLayout => ({ size: HEADER + variables.length, nodes: HEADER + variables.length, variables });

/**
 * The layout of the content of the template `row`: its parameters `label` and `count`, then its `<span>`.
 */
const ROW_LAYOUT: _ScopeLayout = { size: HEADER + 3, nodes: HEADER + 2, variables: ['label', 'count'] };

/**
 * The identifiers of the parameters of the template `row`.
 */
const LABEL = 10;
const COUNT = 11;

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/**
 * Creates the scope of a row reading `item`, a child of the scope declaring the template.
 */
function createRow(declarationContext: _Context, item: unknown): _Context {
  const row = _scope(declarationContext, layoutOf('item'));
  row[HEADER] = item;
  return row;
}

/**
 * Creates the template `row`, declaring the parameters `label` and `count` in the first slots of the context of an
 * instance, which renders a `<span>` whose text reads them through a binding, as the generated code does.
 */
function createTemplate() {
  const instances = new Array<_Context>();
  const texts = new Array<string>();
  const render = vi.fn((parentNode: Element, parentContext: _Context, referenceNode: Comment | null, params: readonly unknown[]) => {
    const context = _scope(parentContext, ROW_LAYOUT);
    context[HEADER] = params[0];
    context[HEADER + 1] = params[1];
    instances.push(context);
    const span = document.createElement('span');
    mountNode(span, parentNode, context, referenceNode, HEADER + 2);
    _bindEffect(context, (scope: _Context) => {
      span.textContent = `${String(scope[HEADER])} ${String(scope[HEADER + 1])}`;
      texts.push(span.textContent);
    }, context, undefined, undefined, [LABEL, COUNT]);
    return context;
  });

  const template: _Template = { render, parameters: [LABEL, COUNT] };
  return { render, instances, template, texts };
}

describe('_parameter', () => {
  it('writes the value of the argument when the @render passes it, also as undefined, in the slot of the parameter', () => {
    const context = _scope(null, layoutOf('first', 'second'));
    _parameter(context, ['a', undefined], 0, 0, () => 'default');
    _parameter(context, ['a', undefined], 1, 1, () => 'default');

    expect(context[HEADER]).toBe('a');
    expect(context[HEADER + 1]).toBeUndefined();
  });

  it('declares the default value when the @render leaves the argument out, computed again when a parameter it reads changes', () => {
    const context = _scope(null, layoutOf('item', 'label'));
    context[HEADER] = 'a';
    _parameter(context, ['a'], 1, 1, scope => `${String(scope[HEADER])}!`, [0]);
    expect(context[HEADER + 1]).toBe('a!');

    update(context, HEADER, 'b');
    refresh(context, [0]);

    expect(context[HEADER + 1]).toBe('b!');
  });

  it('computes the default value again when a signal it reads changes', async () => {
    const suffix = signal('!');
    const context = _scope(null, layoutOf('label'));
    _parameter(context, [], 0, 0, () => `a${suffix()}`);

    suffix.set('?');
    await flush();

    expect(context[HEADER]).toBe('a?');
  });
});

describe('_renderTemplate', () => {
  it('renders an instance before the reference node, in the context of the scope declaring the template, owned by the rendering one', () => {
    const declarationContext = _scope(null, EMPTY_LAYOUT);
    const renderingContext = _scope(declarationContext, EMPTY_LAYOUT);
    const { render, template } = createTemplate();
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.append(anchor);

    _renderTemplate(parent, renderingContext, anchor, { template, depth: 1, args: () => ['a', 1] });

    expect(parent.innerHTML).toBe('<span>a 1</span><!--anchor-->');
    expect(render).toHaveBeenCalledWith(parent, declarationContext, anchor, ['a', 1], CREATE_NODES);
    const [instance] = childrenOf(renderingContext);
    clear(renderingContext);
    expect(nodesOf(instance)).toEqual([]);
    expect(parent.innerHTML).toBe('<!--anchor-->');
  });

  it('passes over the separator the server wrote before the instance, once', () => {
    const { template } = createTemplate();
    const separator = vi.spyOn(CREATE_NODES, 'separator');

    _renderTemplate(document.createElement('div'), _scope(null, EMPTY_LAYOUT), null, { template, args: () => ['a', 1], separated: true });

    expect(separator).toHaveBeenCalledExactlyOnceWith(expect.any(HTMLDivElement), true);
    separator.mockRestore();
  });

  it('updates the parameters of the instance when an argument reading a signal changes, instead of rendering it again', async () => {
    const label = signal('a');
    const { render, template, texts } = createTemplate();
    const parent = document.createElement('div');

    _renderTemplate(parent, _scope(null, EMPTY_LAYOUT), null, { template, args: () => [label(), 1] });

    label.set('b');
    await flush();

    expect(render).toHaveBeenCalledOnce();
    expect(texts).toEqual(['a 1', 'b 1']);
    expect(parent.innerHTML).toBe('<span>b 1</span>');
  });

  it('updates the parameters of the instance when its scope is refreshed with a variable an argument reads', () => {
    const declarationContext = _scope(null, EMPTY_LAYOUT);
    const rowContext = createRow(declarationContext, { name: 'a', count: 1 });
    const { render, template } = createTemplate();
    const parent = document.createElement('div');

    _renderTemplate(parent, rowContext, null, { template, depth: 1, args: scope => [(scope[HEADER] as { name: string }).name, (scope[HEADER] as { count: number }).count], reads: [0] });
    update(rowContext, HEADER, { name: 'b', count: 1 });
    refresh(rowContext, [0]);

    expect(render).toHaveBeenCalledOnce();
    expect(parent.innerHTML).toBe('<span>b 1</span>');
  });

  it('refreshes the instance once with the identifiers of every parameter whose argument changed', async () => {
    const label = signal('a');
    const count = signal(1);
    const { template, texts } = createTemplate();
    const parent = document.createElement('div');

    _renderTemplate(parent, _scope(null, EMPTY_LAYOUT), null, { template, args: () => [label(), count()] });

    label.set('b');
    count.set(2);
    await flush();

    expect(texts).toEqual(['a 1', 'b 2']);
    expect(parent.innerHTML).toBe('<span>b 2</span>');
  });

  it('does not refresh the instance when the arguments computed again keep their values', () => {
    const declarationContext = _scope(null, EMPTY_LAYOUT);
    const rowContext = createRow(declarationContext, { name: 'a' });
    const { template, texts } = createTemplate();

    _renderTemplate(document.createElement('div'), rowContext, null, { template, depth: 1, args: scope => [(scope[HEADER] as { name: string }).name], reads: [0] });
    update(rowContext, HEADER, { name: 'a' });
    refresh(rowContext, [0]);

    expect(texts).toEqual(['a undefined']);
  });

  it('does not make the signals read while rendering the instance dependencies of the code rendering it', async () => {
    const label = signal('a');
    const { template } = createTemplate();
    const renders = vi.fn();
    const stop = effect(() => {
      renders();
      _renderTemplate(document.createElement('div'), _scope(null, EMPTY_LAYOUT), null, { template, args: () => ['x', label()] });
    });

    label.set('b');
    await flush();
    stop();
    expect(renders).toHaveBeenCalledTimes(1);
  });

  it('renders the instances of a @render passing no argument with the same frozen empty array', () => {
    const declarationContext = _scope(null, EMPTY_LAYOUT);
    const { render, template } = createTemplate();
    const config: RenderTemplateConfig = { template };

    _renderTemplate(document.createElement('div'), declarationContext, null, config);
    _renderTemplate(document.createElement('div'), declarationContext, null, config);

    const [firstValues, secondValues] = render.mock.calls.map(call => call[3]);
    expect(firstValues).toEqual([]);
    expect(Object.isFrozen(firstValues)).toBe(true);
    expect(secondValues).toBe(firstValues);
  });

  it('renders the instance far from the declaration as a child of the scope declaring the template, whose variables its content reads, not the ones of the scopes between them named alike', () => {
    const declarationContext = _scope(null, layoutOf('title'));
    declarationContext[HEADER] = 'declared';
    const { template } = createTemplate();
    const middleContext = _scope(declarationContext, layoutOf('title'));
    middleContext[HEADER] = 'shadowed';
    const renderingContext = _scope(_scope(middleContext, EMPTY_LAYOUT), EMPTY_LAYOUT);
    const parent = document.createElement('div');

    _renderTemplate(parent, renderingContext, null, { template, depth: 3, args: () => ['a', 1] });

    const [instance] = childrenOf(renderingContext);
    expect(_read(instance, 1, HEADER)).toBe('declared');
    expect(parent.innerHTML).toBe('<span>a 1</span>');
  });

  it('calls the arguments with the component of the context as this and the context', () => {
    const component = { label: 'a' };
    const declarationContext = _scope(null, EMPTY_LAYOUT, undefined, component);
    const { template } = createTemplate();
    const args = vi.fn(function (this: typeof component, _context: _Context) {
      return [this.label, 1];
    });
    const parent = document.createElement('div');

    _renderTemplate(parent, declarationContext, null, { template, args });

    expect(parent.innerHTML).toBe('<span>a 1</span>');
    expect(args.mock.contexts[0]).toBe(component);
    expect(args.mock.calls[0][0]).toBe(declarationContext);
  });

  it('shares the same config and the same arguments between two instances of the @render, each reading its own context, without writing into the config', () => {
    const declarationContext = _scope(null, EMPTY_LAYOUT);
    const { render, template } = createTemplate();
    const args = vi.fn((scope: _Context) => [scope[HEADER], 1]);
    const config: RenderTemplateConfig = Object.freeze({ template, depth: 1, args, separated: false, reads: Object.freeze([0]) });
    const first = createRow(declarationContext, 'a');
    const second = createRow(declarationContext, 'b');
    const firstParent = document.createElement('div');
    const secondParent = document.createElement('div');

    _renderTemplate(firstParent, first, null, config);
    _renderTemplate(secondParent, second, null, config);
    update(second, HEADER, 'c');
    refresh(second, [0]);

    const scopes = new Map([[first, 'first'], [second, 'second']]);
    expect(firstParent.innerHTML).toBe('<span>a 1</span>');
    expect(secondParent.innerHTML).toBe('<span>c 1</span>');
    expect(args.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'second', 'second']);
    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls.map(call => call[1] === declarationContext)).toEqual([true, true]);
  });
});
