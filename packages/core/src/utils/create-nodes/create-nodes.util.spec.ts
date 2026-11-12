// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { HEADER, LAYOUT } from '../../costants';
import type { _Context } from '../../types/context.type';
import { _scope } from '../context/context.util';
import { CREATE_NODES } from './create-nodes.util';

/**
 * The number of node slots of the contexts of the tests.
 */
const SLOTS = 4;

/**
 * The nodes a context tracks, in mount order.
 */
const nodesOf = (context: _Context): Node[] => context.slice(context[LAYOUT].nodes).filter(Boolean) as Node[];

const createContext = () => _scope(null, { size: HEADER + SLOTS, nodes: HEADER });

describe('CREATE_NODES', () => {
  it('creates the elements with the factory of the context, inserting them when they are mounted, their children created', () => {
    const parent = document.createElement('div');
    const anchor = parent.appendChild(document.createComment('anchor'));
    const element = CREATE_NODES.element(createContext(), parent, 'p');

    expect(element.parentNode).toBeNull();

    CREATE_NODES.mount(element, parent, anchor);

    expect(parent.innerHTML).toBe('<p></p><!--anchor-->');
    expect(CREATE_NODES.children(element)).toBe(CREATE_NODES);
  });

  it('creates the texts with their value before the reference node, tracked by the context', () => {
    const parent = document.createElement('div');
    const anchor = parent.appendChild(document.createComment('anchor'));
    const context = createContext();

    const text = CREATE_NODES.text(context, parent, anchor, 'a', true, HEADER);
    CREATE_NODES.separator(parent, true);

    expect(parent.innerHTML).toBe('a<!--anchor-->');
    expect(nodesOf(context)).toEqual([text]);
  });

  it('creates the anchor of a block, whose content it creates, without marker', () => {
    const parent = document.createElement('div');
    const context = createContext();

    const block = CREATE_NODES.block(context, parent, null, 'if', 'xd-if', false, HEADER);
    const nodes = CREATE_NODES.skip(parent, block);

    expect(block.marker).toBeUndefined();
    expect(parent.innerHTML).toBe('<!--if-->');
    expect(nodesOf(context)).toEqual([block.anchor]);
    expect(CREATE_NODES.adopt(parent, block, '0')).toBe(CREATE_NODES);
    expect(CREATE_NODES.adoptItems(parent, block, [1])).toBe(CREATE_NODES);
    expect(nodes).toBeInstanceOf(Array);
    expect(nodes.length).toBe(0);
    expect(CREATE_NODES.replace(parent, block)).toBe(CREATE_NODES);

    CREATE_NODES.close(parent, block);
    CREATE_NODES.end(parent.attachShadow({ mode: 'open' }), context);

    expect(parent.innerHTML).toBe('<!--if-->');
  });

  it('creates the last block of its parent without anchor, the same frozen block every time, inserting and tracking nothing', () => {
    const parent = document.createElement('div');
    const text = parent.appendChild(document.createTextNode('a'));
    const context = createContext();

    const block = CREATE_NODES.block(context, parent, null, 'if', 'xd-if', true);

    expect(block).toEqual({ anchor: null, marker: undefined });
    expect(Object.isFrozen(block)).toBe(true);
    expect(CREATE_NODES.block(createContext(), document.createElement('p'), text, 'for', 'xd-for', true)).toBe(block);
    expect(parent.childNodes.length).toBe(1);
    expect(nodesOf(context)).toEqual([]);
  });
});
