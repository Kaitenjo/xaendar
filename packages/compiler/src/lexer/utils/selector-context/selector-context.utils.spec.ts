import { describe, expect, it } from 'vitest';
import { getSelectorContext } from './selector-context.utils';

/**
 * Returns the selector context at the end of a template, or at the `|` marking the offset.
 */
const contextOf = (template: string) => {
  const offset = template.includes('|') ? template.indexOf('|') : template.length;
  return getSelectorContext(template.replace('|', ''), offset);
};

describe('getSelectorContext', () => {
  it.each([
    ['nothing written yet', '<', { kind: 'component', span: { start: 1, end: 1 } }],
    ['a partial name', '<my-ch', { kind: 'component', span: { start: 1, end: 6 } }],
    ['a name after spaces', '<  my', { kind: 'component', span: { start: 3, end: 5 } }],
    ['a name after text', '<p>text</p>\n<my', { kind: 'component', span: { start: 13, end: 15 } }],
    ['a name in a block', '@if (a) {\n  <my', { kind: 'component', span: { start: 13, end: 15 } }],
    ['a name nested in an element', '<div><my', { kind: 'component', span: { start: 6, end: 8 } }],
    ['the text after the offset ignored', '<my|-child></my-child>', { kind: 'component', span: { start: 1, end: 3 } }]
  ])('finds the tag name of a component: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['nothing written yet', '<my-child @@', { kind: 'directive', span: { start: 12, end: 12 } }],
    ['a partial selector', '<my-child @@to', { kind: 'directive', span: { start: 12, end: 14 } }],
    ['a structural directive', '<my-child *me', { kind: 'directive', span: { start: 11, end: 13 } }],
    ['a selector after attributes', '<my-child label="a" (picked)="b()" @@to', { kind: 'directive', span: { start: 37, end: 39 } }],
    ['a selector after a directive', '<my-child @@tooltip(text="a") @@me', { kind: 'directive', span: { start: 32, end: 34 } }],
    ['a selector in a conditional binding', '<my-child @if (open) { @@to', { kind: 'directive', span: { start: 25, end: 27 } }],
    ['a selector on a new line', '<my-child\n  @@to', { kind: 'directive', span: { start: 14, end: 16 } }]
  ])('finds the selector of a directive: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['plain text', 'hello'],
    ['a closing tag', '<p></p'],
    ['an expression', '<b>{ a < b'],
    ['a product in an expression', '<b>{ a * b'],
    ['an attribute value', '<b title="{ a < b'],
    ['the name of an attribute', '<my-child la'],
    ['an event', '<my-child (pi'],
    ['a directive inside the parentheses of another one', '<my-child @@tooltip(@@me'],
    ['a directive not preceded by a space', '<my-child label="a"@@to'],
    ['an @@ in the text', '<p>mail@@to'],
    ['a template that cannot be lexed', '<p @x @@to']
  ])('finds nothing in %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});
