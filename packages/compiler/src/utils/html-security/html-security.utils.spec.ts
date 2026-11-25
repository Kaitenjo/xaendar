import { describe, expect, it } from 'vitest';
import { findHtmlSecurityError } from './html-security.utils';

describe('findHtmlSecurityError', () => {
  it('accepts the lists of names of the options of the sanitizer', () => {
    expect(findHtmlSecurityError({ allowElements: ['iframe'], allowAttributes: ['src', 'span[style]'], removeElements: [], removeAttributes: ['a[target]'], urlSchemes: ['https'] })).toBeUndefined();
    expect(findHtmlSecurityError({})).toBeUndefined();
  });

  it('rejects a value that is not an object of lists of names', () => {
    expect(findHtmlSecurityError(['iframe'])).toBe('is not an object of options of the sanitizer');
    expect(findHtmlSecurityError(null)).toBe('is not an object of options of the sanitizer');
    expect(findHtmlSecurityError('iframe')).toBe('is not an object of options of the sanitizer');
    expect(findHtmlSecurityError({ allowElement: ['iframe'] })).toBe('holds allowElement, which is not an option of the sanitizer: allowElements, allowAttributes, removeElements, removeAttributes, urlSchemes');
    expect(findHtmlSecurityError({ allowElements: 'iframe' })).toBe('holds allowElements, which is not a list of names');
    expect(findHtmlSecurityError({ urlSchemes: ['https', 1] })).toBe('holds urlSchemes, which is not a list of names');
  });

  it('rejects the options keeping what always runs code, as the sanitizer does', () => {
    expect(findHtmlSecurityError({ allowAttributes: ['img[onerror]'] })).toBe('keeps what always runs code (The allowAttributes of the sanitizer list img[onerror], keeping an attribute the browser runs (on*, srcdoc)): render such an HTML with trustHtml(), or with a sanitizer of the application, instead');
  });
});
