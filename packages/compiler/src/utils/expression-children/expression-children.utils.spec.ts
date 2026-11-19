import type { CallExpression, Node } from 'typescript';
import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../parser/utils/expression-validator/expression-validator';
import { forEachExpressionChild } from './expression-children.utils';

const textsOf = (node: Node) => {
  const texts = new Array<string>();
  forEachExpressionChild(node, child => {
    texts.push(child.getText());
  });

  return texts;
};

describe('forEachExpressionChild', () => {
  it('visits the children of a node', () => {
    expect(textsOf(validateExpression('a + b').node)).toEqual(['a', '+', 'b']);
  });

  it('visits only the expression of a cast, leaving out its type', () => {
    const call = validateExpression('format(value as Date)').node as CallExpression;

    expect(textsOf(call.arguments[0])).toEqual(['value']);
  });

  it('returns the first truthy value returned by the callback', () => {
    expect(forEachExpressionChild(validateExpression('a + b').node, child => (child.getText() === 'b' ? 'found' : undefined))).toBe('found');
  });
});
