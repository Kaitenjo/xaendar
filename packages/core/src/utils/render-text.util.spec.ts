// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context } = await import('./context.util');
const { _renderLiteralText, _renderText } = await import('./render-text.util');
const { signal } = await import('../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return new _Context({} as never, { createElement: (tag: string) => document.createElement(tag) } as never);
}

describe('_renderText', () => {
  it('renders the initial text', () => {
    const parent = document.createElement('div');
    _renderText(parent, createRoot(), () => 'hello', null);
    expect(parent.textContent).toBe('hello');
  });

  it('keeps the text in sync with the signals it reads', async () => {
    const parent = document.createElement('div');
    const name = signal('a');
    _renderText(parent, createRoot(), () => `hi ${name()}`, null);

    name.set('b');
    await flush();

    expect(parent.textContent).toBe('hi b');
  });

  it('stops updating and removes the node when the context is destroyed', async () => {
    const parent = document.createElement('div');
    const context = createRoot();
    const name = signal('a');
    _renderText(parent, context, () => name(), null);

    context.unlisten();
    name.set('b');
    await flush();

    expect(parent.textContent).toBe('');
  });

  it('inserts the text before the reference node', () => {
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.appendChild(anchor);

    _renderText(parent, createRoot(), () => 'x', anchor);

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
    _renderLiteralText(parent, context, 'static', null);

    context.unlisten();

    expect(parent.textContent).toBe('');
  });

  it('inserts the text before the reference node', () => {
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.appendChild(anchor);

    _renderLiteralText(parent, createRoot(), 'x', anchor);

    expect(anchor.previousSibling?.textContent).toBe('x');
  });
});
