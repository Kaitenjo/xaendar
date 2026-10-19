import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidCustomElementName, matchesCustomElementPattern } from './tags.util';


describe('isValidCustomElementName()', () => {

  describe('valid custom element names', () => {
    it('returns true for a basic hyphenated name', () => {
      expect(isValidCustomElementName('my-element')).toBe(true);
    });

    it('returns true for a name with multiple hyphens', () => {
      expect(isValidCustomElementName('my-custom-element')).toBe(true);
    });

    it('returns true for a name with digits', () => {
      expect(isValidCustomElementName('my-element-1')).toBe(true);
    });

    it('returns true for a name with dots', () => {
      expect(isValidCustomElementName('my.element-x')).toBe(true);
    });

    it('returns true for a name starting with a single letter followed by a hyphen', () => {
      expect(isValidCustomElementName('x-tag')).toBe(true);
    });

    it('returns true for a name with the non-ASCII characters the HTML specification accepts', () => {
      expect(isValidCustomElementName('my-élément')).toBe(true);
      expect(isValidCustomElementName('math-α')).toBe(true);
      expect(isValidCustomElementName('emotion-😍')).toBe(true);
    });
  });

  describe('invalid format', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns false when the name has no hyphen', () => {
      expect(isValidCustomElementName('myelement')).toBe(false);
    });

    it('returns false when the name starts with a digit', () => {
      expect(isValidCustomElementName('1my-element')).toBe(false);
    });

    it('returns false when the name contains uppercase letters', () => {
      expect(isValidCustomElementName('My-element')).toBe(false);
    });

    it('returns false when the name contains spaces', () => {
      expect(isValidCustomElementName('my element')).toBe(false);
    });

    it('returns false when the name starts with a hyphen', () => {
      expect(isValidCustomElementName('-my-element')).toBe(false);
    });

    it('returns false when the name contains @', () => {
      expect(isValidCustomElementName('my@-element')).toBe(false);
    });

    it('returns false when the name contains #', () => {
      expect(isValidCustomElementName('my#-element')).toBe(false);
    });

    it('returns false when the name starts with a non-ASCII letter or contains a non-ASCII character the HTML specification excludes', () => {
      expect(isValidCustomElementName('é-tag')).toBe(false);
      expect(isValidCustomElementName('my-element×')).toBe(false);
      expect(isValidCustomElementName('my-element\u037E')).toBe(false);
    });

    it('returns false when the name is an empty string', () => {
      expect(isValidCustomElementName('')).toBe(false);
    });

    it('logs an error containing "is not a valid custom element name"', () => {
      isValidCustomElementName('InvalidTag');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('is not a valid custom element name'));
    });

    it('logs an error with a description of the naming rules', () => {
      isValidCustomElementName('InvalidTag');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('contain a hyphen'));
    });
  });

  describe('reserved tag names', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns false for "annotation-xml"', () => {
      expect(isValidCustomElementName('annotation-xml')).toBe(false);
    });

    it('returns false for "color-profile"', () => {
      expect(isValidCustomElementName('color-profile')).toBe(false);
    });

    it('returns false for "font-face"', () => {
      expect(isValidCustomElementName('font-face')).toBe(false);
    });

    it('returns false for "missing-glyph"', () => {
      expect(isValidCustomElementName('missing-glyph')).toBe(false);
    });

    it('logs an error containing "is a reserved tag name"', () => {
      isValidCustomElementName('annotation-xml');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('is a reserved tag name'));
    });

    it('lists the reserved names in the error message', () => {
      isValidCustomElementName('annotation-xml');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('annotation-xml'));
    });
  });
});

describe('matchesCustomElementPattern()', () => {
  it('matches the tag names a pattern with wildcards stands for', () => {
    expect(matchesCustomElementPattern('sl-button', ['sl-*'])).toBe(true);
    expect(matchesCustomElementPattern('sl-icon-button', ['x-*', 'sl-*'])).toBe(true);
    expect(matchesCustomElementPattern('my-legacy-widget', ['my-*-widget'])).toBe(true);
  });

  it('matches a pattern without wildcards only to the same tag name', () => {
    expect(matchesCustomElementPattern('my-widget', ['my-widget'])).toBe(true);
    expect(matchesCustomElementPattern('my-widget-x', ['my-widget'])).toBe(false);
  });

  it('matches every other character of a pattern literally', () => {
    expect(matchesCustomElementPattern('my-xwidget', ['my-.widget'])).toBe(false);
    expect(matchesCustomElementPattern('my-.widget', ['my-.widget'])).toBe(true);
  });

  it('matches nothing without patterns', () => {
    expect(matchesCustomElementPattern('sl-button', [])).toBe(false);
  });
});
