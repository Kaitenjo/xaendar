import { describe, expect, it } from 'vitest';
import { ComponentPropertyMetadata } from './component-property-metadata.model';

describe('ComponentPropertyMetadata', () => {
  it('defaults to a non-required property without options', () => {
    const property = new ComponentPropertyMetadata('name', 'string');
    expect(property).toMatchObject({ name: 'name', type: 'string', required: false });
    expect(property.alias).toBeUndefined();
    expect(property.defaultValue).toBeUndefined();
  });

  it('applies the alias even when required is not specified', () => {
    const property = new ComponentPropertyMetadata('name', 'string', { alias: 'n' });
    expect(property.alias).toBe('n');
    expect(property.required).toBe(false);
    expect(property.defaultValue).toBeUndefined();
  });

  it('keeps the default value of an optional property', () => {
    const property = new ComponentPropertyMetadata('name', 'string', { required: false, defaultValue: 'x' });
    expect(property.defaultValue).toBe('x');
  });

  it('ignores an undefined default value of an optional property', () => {
    expect(new ComponentPropertyMetadata('name', 'string', { required: false }).defaultValue).toBeUndefined();
  });

  it('drops the default value of a required property', () => {
    const property = new ComponentPropertyMetadata('name', 'string', { required: true, defaultValue: 'x' });
    expect(property.required).toBe(true);
    expect(property.defaultValue).toBeUndefined();
  });

  describe('getDefaultValue', () => {
    it('returns the default value unless the required flag is requested on a required property', () => {
      const optional = new ComponentPropertyMetadata('a', 'string', { required: false, defaultValue: 1 });
      const required = new ComponentPropertyMetadata('b', 'string', { required: true });
      required.defaultValue = 2;

      expect(optional.getDefaultValue()).toBe(1);
      expect(optional.getDefaultValue(true)).toBe(1);
      expect(required.getDefaultValue()).toBe(2);
      expect(required.getDefaultValue(false)).toBe(2);
      expect(required.getDefaultValue(true)).toBeUndefined();
    });
  });

  describe('setDefaultValue', () => {
    it('sets the default value of an optional property', () => {
      const property = new ComponentPropertyMetadata('name', 'string');
      property.setDefaultValue('x');
      expect(property.defaultValue).toBe('x');
    });

    it('throws for a required property', () => {
      const property = new ComponentPropertyMetadata('name', 'string', { required: true });
      expect(() => property.setDefaultValue('x')).toThrow('Cannot set default value for required property "name".');
    });
  });
});
