import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { narrowSignals } from './signal-narrowing.utils';

/**
 * Narrows the signals of some conditions in a chain enclosed in `context`.
 */
const narrow = (conditions: string[], context: TypeCheckContext) => {
  const chainContext = new TypeCheckContext(context);
  const lines = narrowSignals(conditions.map(condition => validateExpression(condition).node), '__if0', context, chainContext);
  return { lines: lines.map(({ text, mappings }) => [text, mappings]), chainContext };
};

describe('narrowSignals', () => {
  it('declares a constant, without mappings, for each signal the conditions call without arguments, once', () => {
    const context = new TypeCheckContext();
    context.addSignalClassField('user');
    context.addUnresolvableIdentifier('row', 'signal');

    const { lines, chainContext } = narrow(['user()?.name && row()', '!user()!'], context);

    expect(lines).toEqual([
      ['const __if0_user = root.user();', undefined],
      ['const __if0_row = row();', undefined]
    ]);
    expect(chainContext.getNarrowedSignal('user')).toBe('__if0_user');
    expect(chainContext.getNarrowedSignal('row')).toBe('__if0_row');
    expect(context.getNarrowedSignal('user')).toBeUndefined();
  });

  it('leaves out the calls of values, the calls with arguments and the signals read without being called', () => {
    const context = new TypeCheckContext();
    context.addSignalClassField('user');
    context.addUnresolvableIdentifier('field');

    expect(narrow(['isOpen() && field() && user(1) && take(user) && Date()'], context).lines).toEqual([]);
  });

  it('keeps the constant of a signal an enclosing chain narrows', () => {
    const context = new TypeCheckContext();
    context.addSignalClassField('user');
    context.addNarrowedSignal('user', '__if5_user');

    const { lines, chainContext } = narrow(['user().active'], context);

    expect(lines).toEqual([]);
    expect(chainContext.getNarrowedSignal('user')).toBe('__if5_user');
  });
});
