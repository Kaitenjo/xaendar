import { describe, expect, it } from 'vitest';
import { INTERNAL_REQUIRED_INPUTS } from '../../costants';
import { _assertRequiredInputs } from './required-inputs.util';

/**
 * A class whose metadata declare the given required inputs.
 */
const withRequired = (name: string, required?: string[]) => Object.defineProperty({ name }, Symbol.for('Symbol.metadata'), { value: required && { [INTERNAL_REQUIRED_INPUTS]: new Set(required) } });

describe('_assertRequiredInputs', () => {
  it('accepts a class without metadata or without required inputs, whatever is bound', () => {
    expect(() => _assertRequiredInputs({ name: 'Plain' }, undefined, 'code')).not.toThrow();
    expect(() => _assertRequiredInputs(withRequired('Optional'), undefined, 'code')).not.toThrow();
    expect(() => _assertRequiredInputs(withRequired('Empty', []), undefined, 'code')).not.toThrow();
  });

  it('accepts the required inputs all bound', () => {
    expect(() => _assertRequiredInputs(withRequired('Card', ['name', 'kind']), new Set(['kind', 'name', 'other']), 'code')).not.toThrow();
  });

  it('throws for a required input not bound, naming what binds the inputs', () => {
    const card = withRequired('Card', ['name', 'kind']);

    expect(() => _assertRequiredInputs(card, new Set(['name']), 'the code')).toThrow('The required input "kind" of Card is not bound by the code');
    expect(() => _assertRequiredInputs(card, undefined, 'the code')).toThrow('The required input "name" of Card is not bound by the code');
  });
});
