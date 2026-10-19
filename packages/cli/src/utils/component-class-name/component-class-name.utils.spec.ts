import { describe, expect, it } from 'vitest';
import { toComponentClassName } from './component-class-name.utils';

describe('toComponentClassName()', () => {
  it('names the class after the name in PascalCase', () => {
    expect(toComponentClassName('user-card')).toBe('UserCardComponent');
    expect(toComponentClassName('my.el-x')).toBe('MyElXComponent');
    expect(toComponentClassName('x-1')).toBe('X1Component');
  });

  it('drops the characters a TypeScript identifier does not accept', () => {
    expect(toComponentClassName('my-')).toBe('MyComponent');
    expect(toComponentClassName('emotion-😍')).toBe('EmotionComponent');
    expect(toComponentClassName('my-élément')).toBe('MyÉlémentComponent');
  });
});
