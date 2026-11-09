import { describe, expect, it } from 'vitest';
import { INTERNAL_ALIAS_TO_ATTRIBUTE } from '../../costants';
import { _toPropertyName } from './input-names.util';

/**
 * A class whose inputs are bound with the given names, the name of the property of each one by the name it is bound with.
 */
const withInputs = (name: string, aliasToAttribute?: Record<string, string>) => Object.defineProperty({ name }, Symbol.for('Symbol.metadata'), { value: aliasToAttribute && { [INTERNAL_ALIAS_TO_ATTRIBUTE]: aliasToAttribute } });

describe('_toPropertyName', () => {
  const crossed = withInputs('Crossed', { value: 'internalValue', initialValue: 'value', label: 'label' });

  it('translates the name an input is bound with into the name of its property', () => {
    expect(_toPropertyName(crossed, 'value')).toBe('internalValue');
    expect(_toPropertyName(crossed, 'initialValue')).toBe('value');
    expect(_toPropertyName(crossed, 'label')).toBe('label');
  });

  it('keeps a name the class does not declare as an input, as an input a host directive exposes', () => {
    expect(_toPropertyName(crossed, 'hint')).toBe('hint');
    expect(_toPropertyName({ name: 'Plain' }, 'hint')).toBe('hint');
    expect(_toPropertyName(withInputs('Empty'), 'hint')).toBe('hint');
  });

  it('throws for the name of the property of an input declaring an alias', () => {
    expect(() => _toPropertyName(crossed, 'internalValue')).toThrow('"internalValue" is the property of an input of Crossed declaring an alias: bind it by its alias');
  });
});
