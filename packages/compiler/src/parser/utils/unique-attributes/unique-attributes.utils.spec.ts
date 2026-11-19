import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ElementNode } from '../../types/nodes/element-node.type';
import { assertUniqueAttributes, assertUniqueInBranches } from './unique-attributes.utils';

/**
 * Parses the element of a template.
 */
const elementOf = (template: string) => (new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[])[0];

/**
 * Counts `x` and `attr.x` as the same attribute.
 */
const attributeKey = ({ name, attribute }: AttributeNode) => attribute ?? name;

describe('assertUniqueAttributes', () => {
  it('counts the attributes by their key, the branches of a conditional binding apart from each other', () => {
    const { attributes, conditionalBindings } = elementOf('<my-el title="a" @if (cond()) { attr.id="b" } @else { id="c" }></my-el>');
    expect(() => assertUniqueAttributes(attributes, conditionalBindings, attributeKey, key => `"${key}" twice`)).not.toThrow();

    const duplicated = elementOf('<my-el title="a" @if (cond()) { attr.title="b" }></my-el>');
    expect(() => assertUniqueAttributes(duplicated.attributes, duplicated.conditionalBindings, attributeKey, key => `"${key}" twice`)).toThrow('"title" twice');
  });
});

describe('assertUniqueInBranches', () => {
  it('adds the names of the branches to the ones declared, once every branch is checked', () => {
    const { conditionalBindings } = elementOf('<div @if (cond()) { id="a" } @else { title="b" }></div>');
    const declared = new Set(['lang']);
    assertUniqueInBranches(conditionalBindings, declared, (branch, names) => names.add(branch.attributes[0].name));
    expect([...declared]).toEqual(['lang', 'id', 'title']);
  });
});
