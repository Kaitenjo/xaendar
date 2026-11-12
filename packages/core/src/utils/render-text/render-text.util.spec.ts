// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { HEADER } from '../../costants';
import type { _Context } from '../../types/context.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _scope, EMPTY_LAYOUT, ELEMENT_LAYOUT, getNodeStrategy, clear, refresh, swapNodeStrategy, update } = await import('../context/context.util');
const { _renderLiteralText, _renderText } = await import('./render-text.util');
const { signal } = await import('../../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return _scope(null, ELEMENT_LAYOUT);
}

describe('_renderText', () => {
  it('renders the initial text', () => {
    const parent = document.createElement('div');
    _renderText(parent, createRoot(), { value: () => 'hello' }, null);
    expect(parent.textContent).toBe('hello');
  });

  it('calls the expression with the component of the context as this and the context', () => {
    const component = { name: 'world' };
    const context = _scope(createRoot(), EMPTY_LAYOUT, undefined, component);
    const value = vi.fn(function (this: typeof component, _context: _Context) {
      return `hello ${this.name}`;
    });
    const parent = document.createElement('div');

    _renderText(parent, context, { value }, null);

    expect(parent.textContent).toBe('hello world');
    expect(value.mock.contexts[0]).toBe(component);
    expect(value.mock.calls[0][0]).toBe(context);
  });

  it('keeps the text in sync with a variable of the template it reads when the scope is refreshed with it', () => {
    const context = _scope(createRoot(), { size: HEADER + 2, nodes: HEADER + 1, variables: ['name'] });
    context[HEADER] = 'a';
    const parent = document.createElement('div');
    _renderText(parent, context, { value: scope => `hi ${String(scope[HEADER])}`, reads: [0] }, null, false, HEADER + 1);

    update(context, HEADER, 'b');
    refresh(context, [0]);
    // A text at the top of the block of a scope is tracked in its slot
    expect(context[HEADER + 1]).toBe(parent.firstChild);

    expect(parent.textContent).toBe('hi b');
  });

  it('keeps the text in sync with the signals it reads', async () => {
    const parent = document.createElement('div');
    const name = signal('a');
    _renderText(parent, createRoot(), { value: () => `hi ${name()}` }, null);

    name.set('b');
    await flush();

    expect(parent.textContent).toBe('hi b');
  });

  it('renders null and undefined as an empty text, as textContent does, and any other value as its string', async () => {
    const parent = document.createElement('div');
    const value = signal<unknown>(null);
    _renderText(parent, createRoot(), { value: () => value() }, null);
    const node = parent.firstChild as Text;

    expect(node.data).toBe('');

    value.set(0);
    await flush();
    expect(node.data).toBe('0');

    value.set(undefined);
    await flush();
    expect(node.data).toBe('');
    expect(parent.firstChild).toBe(node);
  });

  it('stops updating and removes the node when the context is destroyed', async () => {
    const parent = document.createElement('div');
    const context = createRoot();
    const name = signal('a');
    _renderText(parent, context, { value: () => name() }, null, false, HEADER);

    clear(context);
    name.set('b');
    await flush();

    expect(parent.textContent).toBe('');
  });

  it('inserts the text before the reference node', () => {
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.appendChild(anchor);

    _renderText(parent, createRoot(), { value: () => 'x' }, anchor);

    expect(anchor.previousSibling?.textContent).toBe('x');
  });
});

describe('_renderLiteralText', () => {
  it('renders a static text node', () => {
    const parent = document.createElement('div');
    _renderLiteralText(parent, createRoot(), 'static', null);
    expect(parent.textContent).toBe('static');
  });

  it('removes the node when the context is destroyed', () => {
    const parent = document.createElement('div');
    const context = createRoot();
    _renderLiteralText(parent, context, 'static', null, false, HEADER);

    clear(context);

    expect(parent.textContent).toBe('');
  });

  it('inserts the text before the reference node', () => {
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.appendChild(anchor);

    _renderLiteralText(parent, createRoot(), 'x', anchor);

    expect(anchor.previousSibling?.textContent).toBe('x');
  });

  it('writes the literal only into a node adopted holding another text, such as other line endings', () => {
    const lineFeed = String.fromCharCode(10);
    const carriageReturn = String.fromCharCode(13);
    const parent = document.createElement('div');
    const adopted = parent.appendChild(document.createTextNode(`line${lineFeed}`));
    const context = createRoot();
    swapNodeStrategy(context, { ...getNodeStrategy(context), text: () => adopted });

    _renderLiteralText(parent, context, `line${carriageReturn}${lineFeed}`, null);

    expect(adopted.data).toBe(`line${carriageReturn}${lineFeed}`);
  });
});
