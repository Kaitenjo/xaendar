import { describe, expect, it } from 'vitest';
import { ComponentPropertyMetadata } from './component-property-metadata.model';

describe('ComponentPropertyMetadata', () => {
  it('defaults to a non-required property without options', () => {
    const property = new ComponentPropertyMetadata('name', 'string');
    expect(property).toMatchObject({ name: 'name', type: 'string', required: false });
    expect(property.alias).toBeUndefined();
  });

  it('applies the alias even when required is not specified', () => {
    const property = new ComponentPropertyMetadata('name', 'string', { alias: 'n' });
    expect(property.alias).toBe('n');
    expect(property.required).toBe(false);
  });

  it('keeps where the property is declared', () => {
    const declaration = { fileName: '/src/a.ts', span: { start: 1, end: 5 } };

    expect(new ComponentPropertyMetadata('name', 'string', { declaration }).declaration).toBe(declaration);
    expect(new ComponentPropertyMetadata('name', 'string').declaration).toBeUndefined();
  });

  it('applies the required flag', () => {
    expect(new ComponentPropertyMetadata('name', 'string', { required: true }).required).toBe(true);
    expect(new ComponentPropertyMetadata('name', 'string', { required: false }).required).toBe(false);
  });
});
