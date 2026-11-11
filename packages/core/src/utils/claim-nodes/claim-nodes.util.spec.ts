// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HYDRATE } from '../../costants';
import { _Context } from '../context/context.util';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { deferElementHydration } from '../hydration-triggers/hydration-triggers.util';
import { claimShadowRoot, ClaimNodes, isClaimed } from './claim-nodes.util';

/**
 * The nodes a context tracks, in mount order.
 */
const nodesOf = (context: { getNodeCount(): number, getNode(index: number): Node }): Node[] => Array.from({ length: context.getNodeCount() }, (_item, index) => context.getNode(index));

/**
 * A parent holding the HTML of the server.
 */
function parse(html: string): HTMLDivElement {
  const parent = document.createElement('div');
  parent.innerHTML = html;
  return parent;
}

const createContext = () => new _Context({ createElement: (tagName: string) => document.createElement(tagName) } as never);

let nodeStrategy: ClaimNodes;
let context: _Context;

beforeEach(() => {
  nodeStrategy = new ClaimNodes('x-host');
  context = createContext();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ClaimNodes', () => {
  describe('elements', () => {
    it('adopts the elements in order, as they are, and their children with the same strategy', () => {
      const parent = parse('<p>a</p><b>b</b>');
      const [p, b] = Array.from(parent.children);

      expect(nodeStrategy.element(context, parent, 'p')).toBe(p);
      expect(nodeStrategy.element(context, parent, 'b')).toBe(b);
      expect(nodeStrategy.children(p)).toBe(nodeStrategy);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('creates an element where the node does not match, inserting it there, its children created, with a warning', () => {
      const parent = parse('<div></div><b></b>');
      const [div] = Array.from(parent.children);

      const p = nodeStrategy.element(context, parent, 'p');
      nodeStrategy.mount(p, parent);
      const span = nodeStrategy.element(context, parent, 'span');
      nodeStrategy.mount(span, parent);

      expect(parent.innerHTML).toBe('<p></p><span></span><div></div><b></b>');
      expect(nodeStrategy.children(p)).toBe(CREATE_NODES);
      expect(nodeStrategy.element(context, parent, 'div')).toBe(div);
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <div> where the browser renders <p>, which it creates');
    });

    it('names what the server rendered where an element does not match', () => {
      nodeStrategy.element(context, parse('<!--c-->'), 'p');
      nodeStrategy.element(context, parse('text'), 'p');
      nodeStrategy.element(context, parse(''), 'p');

      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <!--c--> where the browser renders <p>, which it creates');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> the text "text" where the browser renders <p>, which it creates');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> nothing where the browser renders <p>, which it creates');
    });

    it('starts the hydration of an element adopted, marking it as adopted', () => {
      const parent = parse('<x-child></x-child><x-other></x-other>');
      const [child, other] = Array.from(parent.children);
      const hydrate = vi.fn();
      Object.assign(child, { [HYDRATE]: hydrate });

      nodeStrategy.mount(nodeStrategy.element(context, parent, 'x-child'), parent);
      nodeStrategy.mount(nodeStrategy.element(context, parent, 'x-other'), parent);

      expect(hydrate).toHaveBeenCalledOnce();
      expect(isClaimed(child)).toBe(true);
      expect(isClaimed(other)).toBe(true);
      expect(isClaimed(document.createElement('x-child'))).toBe(false);
    });

    it('leaves an element adopted declaring a trigger waiting for it, in the content of a @hydrate hydrating it at once', async () => {
      const parent = parse('<x-child data-xd-hydrate="idle"></x-child>');
      const block = parse('<x-child data-xd-hydrate="idle"></x-child>');
      const [waiting] = Array.from(parent.children);
      const [inBlock] = Array.from(block.children);
      const hydrate = vi.fn();
      Object.assign(waiting, { [HYDRATE]: hydrate });
      Object.assign(inBlock, { [HYDRATE]: hydrate });

      nodeStrategy.mount(nodeStrategy.element(context, parent, 'x-child'), parent);
      const withinBlock = new ClaimNodes('x-host', true);
      withinBlock.mount(withinBlock.element(context, block, 'x-child'), block);

      expect(hydrate).toHaveBeenCalledOnce();
      expect(inBlock.hasAttribute('data-xd-hydrate')).toBe(false);
      expect(waiting.hasAttribute('data-xd-hydrate')).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(hydrate).toHaveBeenCalledTimes(2);
      expect(waiting.hasAttribute('data-xd-hydrate')).toBe(false);
    });
  });

  describe('@hydrate', () => {
    it('passes over the content of a block, returning its nodes, and adopts what follows its anchor', () => {
      const parent = parse('<!--xd-h--><p></p>a<!--/xd-h--><b></b>');
      const [, p, text] = Array.from(parent.childNodes);
      const block = nodeStrategy.block(context, parent, null, 'hydrate', 'xd-h');

      expect(nodeStrategy.skip(parent, block)).toEqual([p, text]);
      expect(nodeStrategy.element(context, parent, 'b')).toBe(parent.lastChild);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('returns no nodes for an empty block', () => {
      const parent = parse('<!--xd-h--><!--/xd-h-->');
      const block = nodeStrategy.block(context, parent, null, 'hydrate', 'xd-h');

      const nodes = nodeStrategy.skip(parent, block);
      expect(nodes).toBeInstanceOf(Array);
      expect(nodes.length).toBe(0);
    });

    it('adopts the content of a block from the node it starts at', () => {
      const parent = parse('<i></i><p></p><!--/xd-h-->');

      nodeStrategy.startAt(parent, parent.childNodes[1]);

      expect(nodeStrategy.element(context, parent, 'p')).toBe(parent.childNodes[1]);
    });

    it('passes over the content of the last block of its parent to the end of the parent, nothing left to adopt', () => {
      const parent = parse('<!--xd-h--><p></p>a');
      const [, p, text] = Array.from(parent.childNodes);
      const block = nodeStrategy.block(context, parent, null, 'hydrate', 'xd-h', true);

      expect(nodeStrategy.skip(parent, block)).toEqual([p, text]);
      nodeStrategy.element(context, parent, 'b');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> nothing where the browser renders <b>, which it creates');
    });

    it('starts at the end of the parent the content of a block that has no node and closes its parent', () => {
      const parent = parse('<i></i>');

      nodeStrategy.startAt(parent, null);
      nodeStrategy.element(context, parent, 'p');

      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> nothing where the browser renders <p>, which it creates');
    });
  });

  describe('@client', () => {
    it('removes what the server rendered in the block, moving the position after its anchor, without warnings', () => {
      const parent = parse('<!--xd-c--><i></i>text<!--xd-c--><b></b><!--/xd-c--><!--/xd-c--><p></p>');
      const p = parent.lastElementChild;
      const block = nodeStrategy.block(context, parent, null, 'client', 'xd-c');

      expect(nodeStrategy.replace(parent, block)).toBe(CREATE_NODES);
      expect(parent.innerHTML).toBe('<!--/xd-c--><p></p>');
      expect(nodeStrategy.element(context, parent, 'p')).toBe(p);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('leaves the position where it is for a block created in place of a missing one', () => {
      const parent = parse('<p></p>');
      const p = parent.firstElementChild;
      const block = nodeStrategy.block(context, parent, null, 'client', 'xd-c');

      expect(nodeStrategy.replace(parent, block)).toBe(CREATE_NODES);
      expect(nodeStrategy.element(context, parent, 'p')).toBe(p);
    });

    it('removes what the server rendered in the last block of its parent, to the end of the parent', () => {
      const parent = parse('<p></p><!--xd-c--><i></i>text');
      nodeStrategy.element(context, parent, 'p');
      const block = nodeStrategy.block(context, parent, null, 'client', 'xd-c', true);

      expect(nodeStrategy.replace(parent, block)).toBe(CREATE_NODES);

      expect(parent.innerHTML).toBe('<p></p>');
      expect(console.warn).not.toHaveBeenCalled();
      nodeStrategy.element(context, parent, 'b');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> nothing where the browser renders <b>, which it creates');
    });
  });

  describe('texts', () => {
    it('adopts a text, after the separator before it, removing the separator', () => {
      const parent = parse('a<!---->b');
      const [first, , second] = Array.from(parent.childNodes);

      expect(nodeStrategy.text(context, parent, null, 'x', false)).toBe(first);
      expect(nodeStrategy.text(context, parent, null, 'x', true)).toBe(second);
      expect(parent.innerHTML).toBe('ab');
      expect(nodesOf(context)).toEqual([first, second]);
    });

    it('creates a text where the server rendered none, as for an empty interpolation, without a warning', () => {
      const parent = parse('<!----><b></b>');

      const text = nodeStrategy.text(context, parent, null, 'x', true);

      expect(parent.innerHTML).toBe('x<b></b>');
      expect(nodesOf(context)).toEqual([text]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('passes over the separator before a @render only when the server wrote one', () => {
      const parent = parse('<!----><!--c-->');

      nodeStrategy.separator(parent, false);
      nodeStrategy.separator(parent, true);
      nodeStrategy.separator(parent, true);

      expect(parent.innerHTML).toBe('<!--c-->');
    });
  });

  describe('blocks', () => {
    it('adopts a block: removes its opening marker and takes the closing one as its anchor, tracked by the context', () => {
      const parent = parse('<!--xd-if:1--><p></p><!--/xd-if--><b></b>');
      const anchor = parent.childNodes[2];

      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if');

      expect(block).toEqual({ anchor, marker: '1', kind: 'xd-if' });
      expect(nodesOf(context)).toEqual([anchor]);
      expect(nodeStrategy.adopt(parent, block, '1')).toBe(nodeStrategy);
      nodeStrategy.element(context, parent, 'p');
      nodeStrategy.close(parent, block);
      expect(nodeStrategy.element(context, parent, 'b')).toBe(parent.lastChild);
      expect(parent.innerHTML).toBe('<p></p><!--/xd-if--><b></b>');
    });

    it('reads no detail from a marker without one, and skips the blocks of the same kind it holds', () => {
      const parent = parse('<!--xd-if--><!--xd-if:0--><!--/xd-if--><!--/xd-if-->');

      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if');

      expect(block).toEqual({ anchor: parent.lastChild, marker: '', kind: 'xd-if' });
    });

    it('adopts the last block of its parent without a marker closing it: removes the opening one, keeps no anchor and tracks nothing', () => {
      const parent = parse('<!--xd-if:1--><p></p>');
      const p = parent.firstElementChild;

      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if', true);

      expect(block).toEqual({ anchor: null, marker: '1', kind: 'xd-if' });
      expect(parent.innerHTML).toBe('<p></p>');
      expect(nodesOf(context)).toEqual([]);
      expect(nodeStrategy.adopt(parent, block, '1')).toBe(nodeStrategy);
      expect(nodeStrategy.element(context, parent, 'p')).toBe(p);
      nodeStrategy.close(parent, block);
      expect(parent.innerHTML).toBe('<p></p>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('creates the last block of its parent where the server rendered another node, emptying the parent from there to its end, with a warning', () => {
      const parent = parse('<p></p><b></b>text<i></i>');
      nodeStrategy.element(context, parent, 'p');

      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if', true);

      expect(block).toBe(CREATE_NODES.block(context, parent, null, 'if', 'xd-if', true));
      expect(block).toEqual({ anchor: null, marker: undefined });
      expect(parent.innerHTML).toBe('<p></p>');
      expect(nodesOf(context)).toEqual([]);
      expect(nodeStrategy.adopt(parent, block, '0')).toBe(CREATE_NODES);
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <b> where the browser renders <!--xd-if-->, which it creates');
      expect(console.warn).toHaveBeenCalledOnce();
    });

    it('creates the last block of its parent where the server rendered nothing, with a warning', () => {
      const parent = parse('');

      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if', true);

      expect(block).toEqual({ anchor: null, marker: undefined });
      expect(parent.childNodes.length).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> nothing where the browser renders <!--xd-if-->, which it creates');
    });

    it('names the last block of its parent by its kind, emptying it to the end of the parent, when the server rendered it differently', () => {
      const parent = parse('<!--xd-sw:0--><p></p>text');
      const block = nodeStrategy.block(context, parent, null, 'switch', 'xd-sw', true);

      expect(nodeStrategy.adopt(parent, block, '1')).toBe(CREATE_NODES);

      expect(parent.childNodes.length).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <!--xd-sw:0--> where the browser renders <!--xd-sw:1-->, which it renders again');
    });

    it('removes, closing the last block of its parent, what the server rendered in it to the end of the parent, with a warning', () => {
      const parent = parse('<!--xd-s:1--><p></p><i></i>text');
      const block = nodeStrategy.block(context, parent, null, 'structural', 'xd-s', true);

      nodeStrategy.element(context, parent, 'p');
      nodeStrategy.close(parent, block);

      expect(parent.innerHTML).toBe('<p></p>');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <i> the browser does not render, which it removes along with what follows it');
      expect(console.warn).toHaveBeenCalledOnce();
      nodeStrategy.element(context, parent, 'b');
      expect(console.warn).toHaveBeenLastCalledWith('Xaendar: the server rendered in <x-host> nothing where the browser renders <b>, which it creates');
    });

    it('empties a block the server rendered differently, with a warning, its content created', () => {
      const parent = parse('<!--xd-if:0--><p></p><!--/xd-if-->');
      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if');

      expect(nodeStrategy.adopt(parent, block, '1')).toBe(CREATE_NODES);
      nodeStrategy.close(parent, block);
      expect(nodeStrategy.adopt(parent, nodeStrategy.block(context, parse('<!--xd-if-->x<!--/xd-if-->'), null, 'if', 'xd-if'), '0')).toBe(CREATE_NODES);

      expect(parent.innerHTML).toBe('<!--/xd-if-->');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <!--xd-if:0--> where the browser renders <!--xd-if:1-->, which it renders again');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <!--xd-if--> where the browser renders <!--xd-if:0-->, which it renders again');
    });

    it('creates a block where the server rendered none, or no marker closing it, with a warning, its content created', () => {
      const parent = parse('<b></b>');
      const unclosed = parse('<!--xd-if:0--><p></p>');

      const block = nodeStrategy.block(context, parent, null, 'if', 'xd-if');
      const other = nodeStrategy.block(context, unclosed, null, 'if', 'xd-if');

      expect(block.marker).toBeUndefined();
      expect(parent.innerHTML).toBe('<!--if--><b></b>');
      expect(nodesOf(context)).toEqual([block.anchor, other.anchor]);
      expect(nodeStrategy.adopt(parent, block, '')).toBe(CREATE_NODES);
      expect(nodeStrategy.adoptItems(parent, block, [])).toBe(CREATE_NODES);
      nodeStrategy.close(parent, block);
      expect(nodeStrategy.element(context, parent, 'b')).toBe(parent.lastChild);
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <b> where the browser renders <!--xd-if-->, which it creates');
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('removes, closing a block, what the server rendered in it and the browser did not adopt, with a warning', () => {
      const parent = parse('<!--xd-s:1--><p></p><i></i><!--/xd-s-->');
      const block = nodeStrategy.block(context, parent, null, 'structural', 'xd-s');

      nodeStrategy.element(context, parent, 'p');
      nodeStrategy.close(parent, block);

      expect(parent.innerHTML).toBe('<p></p><!--/xd-s-->');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <i> the browser does not render, which it removes along with what follows it');
    });
  });

  describe('items', () => {
    it('adopts the items the server rendered with the same keys, removing their markers, skipping the ones of the @for they hold', () => {
      const parent = parse('<!--xd-for--><!--xd-item:n1--><!--xd-item:sa--><b></b><!--xd-for--><!--xd-item:n9--><!--/xd-for--><!--/xd-for-->');
      const block = nodeStrategy.block(context, parent, null, 'for', 'xd-for');

      expect(nodeStrategy.adoptItems(parent, block, [1, 'a'])).toBe(nodeStrategy);
      expect(parent.innerHTML).toBe('<b></b><!--xd-for--><!--xd-item:n9--><!--/xd-for--><!--/xd-for-->');
      expect(nodeStrategy.element(context, parent, 'b')).toBe(parent.firstChild);
    });

    it('adopts a @for without items', () => {
      const parent = parse('<!--xd-for--><!--/xd-for-->');
      const block = nodeStrategy.block(context, parent, null, 'for', 'xd-for');

      expect(nodeStrategy.adoptItems(parent, block, [])).toBe(nodeStrategy);
    });

    it('adopts the items of the last @for of its parent, to the end of the parent', () => {
      const parent = parse('<!--xd-for--><!--xd-item:n1--><b></b><!--xd-for--><!--xd-item:n9--><!--/xd-for--><!--xd-item:n2--><i></i>');
      const block = nodeStrategy.block(context, parent, null, 'for', 'xd-for', true);

      expect(nodeStrategy.adoptItems(parent, block, [1, 2])).toBe(nodeStrategy);
      expect(parent.innerHTML).toBe('<b></b><!--xd-for--><!--xd-item:n9--><!--/xd-for--><i></i>');
      expect(nodeStrategy.element(context, parent, 'b')).toBe(parent.firstChild);
    });

    it('adopts the last @for of its parent without items, nothing following its opening marker', () => {
      const parent = parse('<!--xd-for-->');
      const block = nodeStrategy.block(context, parent, null, 'for', 'xd-for', true);

      expect(nodeStrategy.adoptItems(parent, block, [])).toBe(nodeStrategy);
      expect(parent.childNodes.length).toBe(0);
    });

    it('empties the last @for of its parent to the end of the parent when the server rendered other keys', () => {
      const parent = parse('<!--xd-for--><!--xd-item:n1--><b></b>');
      const block = nodeStrategy.block(context, parent, null, 'for', 'xd-for', true);

      expect(nodeStrategy.adoptItems(parent, block, [2])).toBe(CREATE_NODES);
      expect(parent.childNodes.length).toBe(0);
    });

    it('empties a @for the server rendered with other keys, with a warning, its items created', () => {
      const parent = parse('<!--xd-for--><!--xd-item:n1--><b></b><!--/xd-for-->');
      const fewer = parse('<!--xd-for--><!--xd-item:n1--><!--/xd-for-->');

      expect(nodeStrategy.adoptItems(parent, nodeStrategy.block(context, parent, null, 'for', 'xd-for'), ['1'])).toBe(CREATE_NODES);
      expect(nodeStrategy.adoptItems(fewer, nodeStrategy.block(context, fewer, null, 'for', 'xd-for'), [1, 2])).toBe(CREATE_NODES);

      expect(parent.innerHTML).toBe('<!--/xd-for-->');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> other items in a <!--xd-for--> than the browser renders, which it renders again');
    });
  });

  describe('shadow root', () => {
    it('removes the style the server wrote first for a component with a stylesheet, and only then', () => {
      const styled = document.createElement('div').attachShadow({ mode: 'open' });
      styled.innerHTML = '<style>p{}</style><p></p>';
      const plain = document.createElement('div').attachShadow({ mode: 'open' });
      plain.innerHTML = '<style>p{}</style>';
      const empty = document.createElement('div').attachShadow({ mode: 'open' });

      claimShadowRoot(styled, true);
      claimShadowRoot(plain, false);
      claimShadowRoot(empty, true);

      expect(styled.innerHTML).toBe('<p></p>');
      expect(plain.innerHTML).toBe('<style>p{}</style>');
    });

    it('removes, at the end, what the server rendered and the browser did not adopt, with a warning, and forgets the positions', () => {
      const root = document.createElement('x-host').attachShadow({ mode: 'open' });
      root.innerHTML = '<p></p><i></i><b></b>';
      const claim = claimShadowRoot(root, false);

      claim.element(context, root, 'p');
      claim.end(root, context);

      expect(root.innerHTML).toBe('<p></p>');
      expect(console.warn).toHaveBeenCalledWith('Xaendar: the server rendered in <x-host> <i> the browser does not render, which it removes along with what follows it');
      expect(claim.element(context, root, 'p')).toBe(root.firstChild);
    });

    it('renders again without warnings what differs in a hydration that waited for a trigger, and in the components it adopts', () => {
      const block = parse('<x-child></x-child><div></div>');
      const child = block.firstElementChild!;
      child.attachShadow({ mode: 'open' }).innerHTML = '<i></i>';
      const withinBlock = new ClaimNodes('x-host', true);
      withinBlock.mount(withinBlock.element(context, block, 'x-child'), block);
      withinBlock.mount(withinBlock.element(context, block, 'p'), block);
      withinBlock.end(block as unknown as ShadowRoot, context);

      const childClaim = claimShadowRoot(child.shadowRoot!, false);
      childClaim.element(context, child.shadowRoot!, 'b');

      const waited = document.body.appendChild(document.createElement('x-waited'));
      waited.setAttribute('data-xd-hydrate', 'interaction');
      waited.attachShadow({ mode: 'open' }).innerHTML = '<i></i>';
      deferElementHydration(waited, () => undefined);
      waited.click();
      claimShadowRoot(waited.shadowRoot!, false).element(context, waited.shadowRoot!, 'b');

      expect(block.firstElementChild).toBe(child);
      expect(block.innerHTML).toBe('<x-child></x-child><p></p>');
      expect(console.warn).not.toHaveBeenCalled();
      waited.remove();
    });

    it('hydrates an element declaring never in a hydration that waited for a trigger: the template decides for it', () => {
      const block = parse('<x-child data-xd-hydrate="never"></x-child>');
      const child = block.firstElementChild!;
      const start = vi.fn();
      (child as unknown as Record<symbol, () => void>)[HYDRATE] = start;
      const withinBlock = new ClaimNodes('x-host', true);

      withinBlock.mount(withinBlock.element(context, block, 'x-child'), block);

      expect(start).toHaveBeenCalledOnce();
      expect(child.hasAttribute('data-xd-hydrate')).toBe(false);
    });

    it('removes nothing at the end when every node is adopted', () => {
      const root = document.createElement('x-host').attachShadow({ mode: 'open' });
      root.innerHTML = '<p></p>';
      const claim = claimShadowRoot(root, false);

      claim.element(context, root, 'p');
      claim.end(root, context);

      expect(root.innerHTML).toBe('<p></p>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('makes the contexts of the render create what they render once the hydration ends, at any depth', () => {
      const root = document.createElement('x-host').attachShadow({ mode: 'open' });
      const claim = claimShadowRoot(root, false);
      const render = new _Context(context, claim);
      const nested = render.addChild(new _Context(render, claim)).addChild();

      claim.end(root, render);

      expect(render.nodeStrategy).toBe(CREATE_NODES);
      expect(nested.nodeStrategy).toBe(CREATE_NODES);
    });
  });
});
