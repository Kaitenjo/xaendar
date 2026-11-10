import { describe, expect, it } from 'vitest';
import { describeVariableCall } from './variable-calls.utils';

const calls = { variableCalls: [{ name: 'row', span: { start: 10, end: 13 } }] };

describe('describeVariableCall', () => {
  it('tells that a variable called where TypeScript reports a value that is not a function is not a signal', () => {
    expect(describeVariableCall(calls, { start: 10, end: 13 }, 2349)).toBe('\'row\' is a template variable, not a signal: remove the parentheses and read it as row, since the variables of a template (@for, @let, parameters of a template) hold their values');
  });

  it('describes nothing for another error on the same span', () => {
    expect(describeVariableCall(calls, { start: 10, end: 13 }, 2339)).toBeUndefined();
  });

  it('describes nothing for a value that is not a function called elsewhere, as a member of the component', () => {
    expect(describeVariableCall(calls, { start: 20, end: 25 }, 2349)).toBeUndefined();
  });

  it('describes nothing for a template calling no variable', () => {
    expect(describeVariableCall({}, { start: 10, end: 13 }, 2349)).toBeUndefined();
  });
});
