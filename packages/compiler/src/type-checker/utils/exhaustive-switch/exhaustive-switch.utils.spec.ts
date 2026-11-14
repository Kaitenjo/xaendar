import { describe, expect, it } from 'vitest';
import { describeExhaustiveSwitch } from './exhaustive-switch.utils';

describe('describeExhaustiveSwitch', () => {
  const typeCheck = { exhaustiveSwitches: [{ start: 40, end: 55 }, { start: 5, end: 20 }] };
  const uncovered = 'Type \'"error"\' does not satisfy the expected type \'never\'.';

  it('names the type the cases leave uncovered, for an error on a @default never;', () => {
    expect(describeExhaustiveSwitch(typeCheck, { start: 5, end: 20 }, 1360, uncovered)).toBe('@switch is not exhaustive: no @case covers "error". Add the missing @case, or replace @default never; with a @default branch.');
  });

  it('falls back to every value of the expression when the message names no type', () => {
    expect(describeExhaustiveSwitch(typeCheck, { start: 40, end: 55 }, 1360, 'Something else.')).toBe('@switch is not exhaustive: no @case covers every value of its expression. Add the missing @case, or replace @default never; with a @default branch.');
  });

  it('describes nothing for another error, another span, or a template without @default never;', () => {
    expect(describeExhaustiveSwitch(typeCheck, { start: 5, end: 20 }, 2322, uncovered)).toBeUndefined();
    expect(describeExhaustiveSwitch(typeCheck, { start: 21, end: 30 }, 1360, uncovered)).toBeUndefined();
    expect(describeExhaustiveSwitch({}, { start: 5, end: 20 }, 1360, uncovered)).toBeUndefined();
  });
});
