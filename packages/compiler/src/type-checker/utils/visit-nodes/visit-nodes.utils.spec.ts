import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { visitNodes } from './visit-nodes.utils';

/**
 * The tags of the elements of a template, in the order they are visited.
 */
const tags = (template: string) => {
  const visited = new Array<string>();
  visitNodes(parseTemplate(template), (node: ASTNode) => {
    if (node.type === ASTNodeType.Element) {
      visited.push(node.tagName);
    }
  });

  return visited;
};

describe('visitNodes', () => {
  it('visits each node before the nodes it holds, and the next one after them', () => {
    expect(tags('<a><b><i></i></b></a><p></p>')).toEqual(['a', 'b', 'i', 'p']);
  });

  it.each([
    ['an element', '<a><b></b></a>', ['a', 'b']],
    ['an @if, an @else if and an @else', '@if (a) { <a></a> } @else if (b) { <b></b> } @else { <i></i> }', ['a', 'b', 'i']],
    ['an @if without an @else', '@if (a) { <a></a> }', ['a']],
    ['a @for', '@for (item of items; track item()) { <a></a> }', ['a']],
    ['a @switch', '@switch (a) { @case (1) { <a></a> } @case (2) { <b></b> } }', ['a', 'b']],
    ['a template', '<template row()><a></a></template>', ['a']],
    ['a @hydrate', '@hydrate (idle) { <a></a> }', ['a']],
    ['a @client', '@client { <a></a> }', ['a']],
    ['a @client and its @placeholder', '@client { <a></a> } @placeholder { <b></b> }', ['a', 'b']],
    ['a @try and its @catch', '@try { <a></a> } @catch (error) { <b></b> }', ['a', 'b']],
    ['a @defer', '@defer (idle) { <a></a> }', ['a']],
    ['a @defer and the blocks following it', '@defer (idle) { <a></a> } @error { <d></d> } @placeholder { <b></b> } @loading { <c></c> }', ['a', 'b', 'c', 'd']]
  ])('goes through %s', (_name, template, expected) => {
    expect(tags(template)).toEqual(expected);
  });

  it('visits the nodes holding nothing', () => {
    const visited = new Array<ASTNodeType>();
    visitNodes(parseTemplate('text'), ({ type }) => visited.push(type));

    expect(visited).toEqual([ASTNodeType.Text]);
  });
});
