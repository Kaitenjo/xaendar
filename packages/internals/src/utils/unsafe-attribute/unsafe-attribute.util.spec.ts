import { describe, expect, it } from 'vitest';
import type { AttributeReader } from '../../types/attribute-reader.type';
import { describeUnsafeAttribute, describeUnsafeElementAttribute } from './unsafe-attribute.util';

/**
 * Reads the attributes of an element from an object, as the compiler and core read them.
 */
function attributesOf(attributes: Record<string, string>): AttributeReader {
  return { getAttribute: name => attributes[name] };
}

describe('describeUnsafeAttribute()', () => {
  it('rejects the event handler attributes, whatever their case', () => {
    expect(describeUnsafeAttribute('onClick')).toBe('writes code the browser runs from a value of the application: listen to the click event instead');
  });

  it('rejects srcdoc', () => {
    expect(describeUnsafeAttribute('srcdoc')).toBe('writes a document the browser runs from a value of the application: bind the src of a page instead');
  });

  it('allows the other attributes', () => {
    expect(describeUnsafeAttribute('title')).toBeUndefined();
  });
});

describe('describeUnsafeElementAttribute()', () => {
  const none = attributesOf({});

  it('rejects the attributes restricting the page of an iframe', () => {
    expect(describeUnsafeElementAttribute('IFRAME', 'sandbox', none)).toContain('sets a restriction of the <iframe>');
    expect(describeUnsafeElementAttribute('iframe', 'allowFullscreen', none)).toContain('sets a restriction of the <iframe>');
    expect(describeUnsafeElementAttribute('iframe', 'title', none)).toBeUndefined();
  });

  it('rejects the attributeName of an SVG animation', () => {
    expect(describeUnsafeElementAttribute('animateMotion', 'attributeName', none)).toContain('chooses the attribute the animation writes');
  });

  it('rejects the values of an SVG animation writing an href', () => {
    expect(describeUnsafeElementAttribute('set', 'to', attributesOf({ attributeName: 'href' }))).toBe('writes into href a value of the application, which no check of the URLs reaches: bind href itself instead');
    expect(describeUnsafeElementAttribute('animate', 'values', attributesOf({ attributeName: 'xlink:href' }))).toContain('writes into xlink:href');
  });

  it('allows the values of an SVG animation writing another attribute', () => {
    expect(describeUnsafeElementAttribute('animate', 'to', attributesOf({ attributeName: 'opacity' }))).toBeUndefined();
    expect(describeUnsafeElementAttribute('animate', 'to', none)).toBeUndefined();
    expect(describeUnsafeElementAttribute('animate', 'dur', none)).toBeUndefined();
  });

  it('rejects the pragma of a meta, and the page of its refresh', () => {
    expect(describeUnsafeElementAttribute('meta', 'http-equiv', none)).toContain('chooses the pragma of the <meta>');
    expect(describeUnsafeElementAttribute('meta', 'content', attributesOf({ 'http-equiv': 'Refresh' }))).toContain('writes the page a refresh of the <meta> goes to');
  });

  it('allows the content of any other meta', () => {
    expect(describeUnsafeElementAttribute('meta', 'content', attributesOf({ 'http-equiv': 'content-type' }))).toBeUndefined();
    expect(describeUnsafeElementAttribute('meta', 'content', none)).toBeUndefined();
    expect(describeUnsafeElementAttribute('meta', 'name', none)).toBeUndefined();
  });

  it('allows the attributes of the other elements', () => {
    expect(describeUnsafeElementAttribute('div', 'sandbox', none)).toBeUndefined();
  });
});
