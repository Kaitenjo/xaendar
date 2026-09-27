import { describe, expect, it } from 'vitest';
import { toKebabCase, toPascalCase } from './case.utils';

describe('toPascalCase()', () => {
  it('converts a kebab-case string to PascalCase', () => {
    expect(toPascalCase('my-button')).toBe('MyButton');
  });

  it('converts a snake_case string to PascalCase', () => {
    expect(toPascalCase('my_button')).toBe('MyButton');
  });

  it('converts a camelCase string to PascalCase', () => {
    expect(toPascalCase('myButton')).toBe('MyButton');
  });

  it('capitalizes a single lowercase word', () => {
    expect(toPascalCase('button')).toBe('Button');
  });
});

describe('toKebabCase()', () => {
  it('converts a PascalCase string to kebab-case', () => {
    expect(toKebabCase('MyButton')).toBe('my-button');
  });

  it('converts a camelCase string to kebab-case', () => {
    expect(toKebabCase('myButton')).toBe('my-button');
  });

  it('converts a snake_case string to kebab-case', () => {
    expect(toKebabCase('my_button')).toBe('my-button');
  });

  it('lowercases a single word unchanged', () => {
    expect(toKebabCase('button')).toBe('button');
  });
});
