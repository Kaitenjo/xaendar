// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { ClaimNodes } from '../claim-nodes/claim-nodes.util';
import { HEADER } from '../../costants';
import { _scope, clear, ELEMENT_LAYOUT, EMPTY_LAYOUT } from '../context/context.util';
import type { _Context } from '../../types/context.type';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { _client } from './client.util';

const createRoot = (nodeStrategy?: NodeStrategy) => _scope(null, EMPTY_LAYOUT, nodeStrategy);

/**
 * The content of a block, rendering an element before the anchor it receives, through the strategy it receives.
 */
const content = (tagName: string) => vi.fn((parentNode: HTMLElement, parentContext: _Context, anchor: Node | null, nodeStrategy: NodeStrategy) => {
  const context = _scope(parentContext, EMPTY_LAYOUT, nodeStrategy);
  const element = nodeStrategy.element(context, parentNode, tagName);
  nodeStrategy.mount(element, parentNode, anchor);
  return context;
});

/**
 * A parent holding the HTML of the server.
 */
const parse = (html: string) => {
  const parent = document.createElement('div');
  parent.innerHTML = html;
  return parent;
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('_client', () => {
  it('renders the content before its anchor in a page rendered in the browser', () => {
    const parent = document.createElement('div');
    const render = content('b');

    _client(parent, createRoot(), null, render);

    expect(parent.innerHTML).toBe('<b></b><!--client-->');
    expect(render.mock.calls[0][3]).toBe(CREATE_NODES);
  });

  it('removes the placeholder of the server, creating the content in its place without warnings, and adopts what follows', () => {
    const parent = parse('<!--xd-c--><i>wait</i>text<!--/xd-c--><p></p>');
    const p = parent.lastElementChild!;
    const strategy = new ClaimNodes('x-host');
    const render = content('b');
    const context = createRoot(strategy);

    _client(parent, context, null, render);

    expect(parent.innerHTML).toBe('<b></b><!--/xd-c--><p></p>');
    expect(render.mock.calls[0][3]).toBe(CREATE_NODES);
    expect(strategy.element(context, parent, 'p')).toBe(p);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('creates the content between empty markers', () => {
    const parent = parse('<!--xd-c--><!--/xd-c-->');

    _client(parent, createRoot(new ClaimNodes('x-host')), null, content('b'));

    expect(parent.innerHTML).toBe('<b></b><!--/xd-c-->');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('creates block and content, with a warning, where the server wrote no marker', () => {
    const parent = parse('<p></p>');

    _client(parent, createRoot(new ClaimNodes('x-host')), null, content('b'));

    expect(parent.innerHTML).toBe('<b></b><!--client--><p></p>');
    expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <p> where the browser renders <!--xd-c-->, which it creates');
  });

  it('renders the last block of its parent without anchor, appending the content, in a page rendered in the browser', () => {
    const parent = parse('<i></i>');
    const context = createRoot();
    const block = vi.spyOn(CREATE_NODES, 'block');
    const render = content('b');

    _client(parent, context, null, render, true);

    expect(block).toHaveBeenCalledExactlyOnceWith(context, parent, null, 'client', 'xd-c', true, undefined);
    expect(parent.innerHTML).toBe('<i></i><b></b>');
    expect(render.mock.calls[0][2]).toBeNull();
  });

  it('removes the placeholder of the server of the last block of its parent, to the end of the parent, creating the content there', () => {
    const parent = parse('<p></p><!--xd-c--><i>wait</i>text');
    const strategy = new ClaimNodes('x-host');
    const context = createRoot(strategy);
    const render = content('b');
    strategy.element(context, parent, 'p');

    _client(parent, context, null, render, true);

    expect(parent.innerHTML).toBe('<p></p><b></b>');
    expect(render.mock.calls[0][2]).toBeNull();
    expect(render.mock.calls[0][3]).toBe(CREATE_NODES);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('owns the context of the content, which it removes when destroyed', () => {
    const parent = document.createElement('div');
    const context = createRoot();
    _client(parent, context, null, (parentNode, parentContext, anchor, nodeStrategy) => {
      const child = _scope(parentContext, ELEMENT_LAYOUT, nodeStrategy);
      nodeStrategy.text(child, parentNode, anchor, 'hello', false, HEADER);
      return child;
    });
    expect(parent.textContent).toBe('hello');

    clear(context);

    expect(parent.textContent).toBe('');
  });
});
