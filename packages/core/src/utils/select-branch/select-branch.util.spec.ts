import { describe, expect, it, vi } from 'vitest';
import type { RenderConditionalBinding } from '../../types/render-conditional-binding.type';
import { _selectBranch } from './select-branch.util';

/**
 * The bindings of a branch, named to tell the branches apart.
 */
type Branch = {
  name: string,
  conditionalBindings: RenderConditionalBinding<Branch>[]
};

describe('_selectBranch', () => {
  it('selects the first branch of an @if chain whose condition holds, without evaluating the following conditions', () => {
    const last = vi.fn(() => true);
    const selected = _selectBranch<Branch>({
      branches: [
        { name: 'if', condition: () => false, conditionalBindings: [] },
        { name: 'else if', condition: () => true, conditionalBindings: [] },
        { name: 'other', condition: last, conditionalBindings: [] }
      ]
    });

    expect(selected?.name).toBe('else if');
    expect(last).not.toHaveBeenCalled();
  });

  it('selects the @else branch when no condition holds, and nothing without it', () => {
    const elseBranch = { name: 'else', conditionalBindings: [] };

    expect(_selectBranch<Branch>({ branches: [{ name: 'if', condition: () => false, conditionalBindings: [] }, elseBranch] })).toBe(elseBranch);
    expect(_selectBranch<Branch>({ branches: [{ name: 'if', condition: () => false, conditionalBindings: [] }] })).toBeUndefined();
  });

  it('selects the @case branch one of whose values is strictly equal to the value of the expression', () => {
    const selected = _selectBranch<Branch>({
      expression: () => 2,
      branches: [
        { name: 'one', condition: [1, '2'], conditionalBindings: [] },
        { name: 'two', condition: [3, 2], conditionalBindings: [] }
      ]
    });

    expect(selected?.name).toBe('two');
  });

  it('selects the @default branch when no @case matches, and nothing without it', () => {
    const defaultBranch = { name: 'default', condition: null, conditionalBindings: [] };

    expect(_selectBranch<Branch>({ expression: () => 'x', branches: [{ name: 'a', condition: ['a'], conditionalBindings: [] }, defaultBranch] })).toBe(defaultBranch);
    expect(_selectBranch<Branch>({ expression: () => 'x', branches: [{ name: 'a', condition: ['a'], conditionalBindings: [] }] })).toBeUndefined();
  });
});
