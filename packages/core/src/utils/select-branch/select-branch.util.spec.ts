import { describe, expect, it, vi } from 'vitest';
import type { RenderConditionalBinding } from '../../types/render-conditional-binding.type';
import { _scope, EMPTY_LAYOUT } from '../context/context.util';
import type { _Context } from '../../types/context.type';
import { _selectBranch, _selectBranchIndex } from './select-branch.util';

/**
 * The bindings of a branch, named to tell the branches apart.
 */
type Branch = {
  name: string
};

/**
 * The component a context renders, read by the conditions through `this`.
 */
type Component = {
  limit: number
};

const component: Component = { limit: 1 };
const context = _scope(null, EMPTY_LAYOUT, undefined, component);

describe('_selectBranch', () => {
  it('selects the first branch of an @if chain whose condition holds, without evaluating the following conditions', () => {
    const last = vi.fn(() => true);
    const selected = _selectBranch<Branch>({
      branches: [
        { name: 'if', condition: () => false },
        { name: 'else if', condition: () => true },
        { name: 'other', condition: last }
      ]
    }, context);

    expect(selected?.name).toBe('else if');
    expect(last).not.toHaveBeenCalled();
  });

  it('calls the conditions with the component of the context as this and the context', () => {
    const condition = vi.fn(function (this: Component, _context: _Context) {
      return this.limit > 0;
    });

    expect(_selectBranch<Branch>({ branches: [{ name: 'if', condition }] }, context)?.name).toBe('if');
    expect(condition).toHaveBeenCalledExactlyOnceWith(context);
    expect(condition.mock.contexts).toEqual([component]);
  });

  it('selects the @else branch when no condition holds, and nothing without it', () => {
    const elseBranch = { name: 'else' };

    expect(_selectBranch<Branch>({ branches: [{ name: 'if', condition: () => false }, elseBranch] }, context)).toBe(elseBranch);
    expect(_selectBranch<Branch>({ branches: [{ name: 'if', condition: () => false }] }, context)).toBeUndefined();
  });

  it('selects the @case branch one of whose values is strictly equal to the value of the expression', () => {
    const selected = _selectBranch<Branch>({
      expression: () => 2,
      branches: [
        { name: 'one', condition: [1, '2'] },
        { name: 'two', condition: [3, 2] }
      ]
    }, context);

    expect(selected?.name).toBe('two');
  });

  it('calls the expression of a @switch with the component of the context as this and the context', () => {
    const expression = vi.fn(function (this: Component, _context: _Context) {
      return this.limit;
    });

    expect(_selectBranch<Branch>({ expression, branches: [{ name: 'one', condition: [1] }] }, context)?.name).toBe('one');
    expect(expression).toHaveBeenCalledExactlyOnceWith(context);
    expect(expression.mock.contexts).toEqual([component]);
  });

  it('selects the @default branch when no @case matches, and nothing without it', () => {
    const defaultBranch = { name: 'default', condition: null };

    expect(_selectBranch<Branch>({ expression: () => 'x', branches: [{ name: 'a', condition: ['a'] }, defaultBranch] }, context)).toBe(defaultBranch);
    expect(_selectBranch<Branch>({ expression: () => 'x', branches: [{ name: 'a', condition: ['a'] }] }, context)).toBeUndefined();
  });

  it('selects, in the conditional binding of a tag, a @default written before a matching @case, as the first branch holding', () => {
    const selected = _selectBranch<Branch>({
      expression: () => 'a',
      branches: [
        { name: 'default', condition: null },
        { name: 'a', condition: ['a'] }
      ]
    }, context);

    expect(selected?.name).toBe('default');
  });
});

describe('_selectBranchIndex', () => {
  it('returns the index of the first branch of an @if chain whose condition holds, -1 when none does', () => {
    expect(_selectBranchIndex<Branch>({ branches: [{ name: 'if', condition: () => false }, { name: 'else' }] }, context)).toBe(1);
    expect(_selectBranchIndex<Branch>({ branches: [{ name: 'if', condition: () => false }] }, context)).toBe(-1);
  });

  it('returns the index of the @case one of whose values is strictly equal to the value of the expression, -1 when none is and there is no @default', () => {
    const conditionalBinding: RenderConditionalBinding<Branch> = {
      expression: () => 3,
      branches: [
        { name: 'one', condition: [1] },
        { name: 'three', condition: ['3', 3] }
      ]
    };

    expect(_selectBranchIndex(conditionalBinding, context)).toBe(1);
    expect(_selectBranchIndex(conditionalBinding, context, true)).toBe(1);
    expect(_selectBranchIndex<Branch>({ expression: () => 2, branches: [{ name: 'one', condition: [1] }] }, context, true)).toBe(-1);
  });

  it('without defaultLast selects a @default written before a matching @case, as the first branch holding', () => {
    const conditionalBinding: RenderConditionalBinding<Branch> = {
      expression: () => 'b',
      branches: [
        { name: 'a', condition: ['a'] },
        { name: 'default', condition: null },
        { name: 'b', condition: ['b'] }
      ]
    };

    expect(_selectBranchIndex(conditionalBinding, context)).toBe(1);
    expect(_selectBranchIndex(conditionalBinding, context, false)).toBe(1);
  });

  it('with defaultLast selects a matching @case written after the @default, and the @default only when no @case matches', () => {
    const value = vi.fn(() => 'b');
    const conditionalBinding: RenderConditionalBinding<Branch> = {
      expression: value,
      branches: [
        { name: 'a', condition: ['a'] },
        { name: 'default', condition: null },
        { name: 'b', condition: ['b'] }
      ]
    };

    expect(_selectBranchIndex(conditionalBinding, context, true)).toBe(2);

    value.mockReturnValue('z');
    expect(_selectBranchIndex(conditionalBinding, context, true)).toBe(1);
  });

  it('with defaultLast selects the first @default when several are written and no @case matches', () => {
    const conditionalBinding: RenderConditionalBinding<Branch> = {
      expression: () => 'z',
      branches: [
        { name: 'first', condition: null },
        { name: 'a', condition: ['a'] },
        { name: 'second', condition: null }
      ]
    };

    expect(_selectBranchIndex(conditionalBinding, context, true)).toBe(0);
  });
});
