import { describe, expect, it } from 'vitest';
import { NOT_ALLOWED_TAGS } from './not-alllowed-tags.constants';

describe('NOT_ALLOWED_TAGS', () => {

  it('is a non-empty array of strings', () => {
    expect(Array.isArray(NOT_ALLOWED_TAGS)).toBe(true);
    expect(NOT_ALLOWED_TAGS.length).toBeGreaterThan(0);
    expect(NOT_ALLOWED_TAGS.every((tag) => typeof tag === 'string')).toBe(true);
  });

  it('contains the HTML/SVG reserved custom element names', () => {
    expect(NOT_ALLOWED_TAGS).toEqual([
      'annotation-xml',
      'color-profile',
      'font-face',
      'font-face-src',
      'font-face-uri',
      'font-face-format',
      'font-face-name',
      'missing-glyph'
    ]);
  });
});
