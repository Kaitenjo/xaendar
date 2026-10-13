import { describe, expect, it } from 'vitest';
import { getBindingContext } from './binding-context.utils';

/**
 * Returns the binding context at the end of a template, or at the `|` marking the offset.
 */
const contextOf = (template: string) => {
  const offset = template.includes('|') ? template.indexOf('|') : template.length;
  return getBindingContext(template.replace('|', ''), offset);
};

describe('getBindingContext', () => {
  it.each([
    ['nothing written yet', '<my-child ', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 10, end: 10 } }],
    ['a partial name', '<my-child la', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 10, end: 12 } }],
    ['a name on a new line', '<my-child\n  la', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 12, end: 14 } }],
    ['a name after other bindings', '<my-child a="{ b }" (c)="d()" @@e(f="g") ', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 41, end: 41 } }],
    ['a name in a conditional binding', '<my-child @if (open) { la', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 23, end: 25 } }],
    ['a name of a nested element', '<div>@if (a) { <my-child la', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 25, end: 27 } }],
    ['the text after the offset ignored', '<my-child la|bel="x"></my-child>', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 10, end: 12 } }]
  ])('finds an attribute of the element: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['nothing written yet', '<my-child (', { kind: 'event', tagName: 'my-child', directive: undefined, span: { start: 11, end: 11 } }],
    ['a partial name', '<my-child (pi', { kind: 'event', tagName: 'my-child', directive: undefined, span: { start: 11, end: 13 } }]
  ])('finds an event of the element: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['an attribute of a directive', '<my-child @@tooltip(te', { kind: 'attribute', tagName: 'my-child', directive: 'tooltip', span: { start: 20, end: 22 } }],
    ['an attribute after another', '<my-child @@tooltip(text="a" ', { kind: 'attribute', tagName: 'my-child', directive: 'tooltip', span: { start: 29, end: 29 } }],
    ['an event of a directive', '<my-child @@tooltip((sh', { kind: 'event', tagName: 'my-child', directive: 'tooltip', span: { start: 21, end: 23 } }],
    ['an attribute of a structural directive', '<my-child *media(q', { kind: 'attribute', tagName: 'my-child', directive: 'media', span: { start: 17, end: 18 } }],
    ['an attribute of the element after a directive', '<my-child @@tooltip(text="a") la', { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 30, end: 32 } }]
  ])('finds the bindings in the parentheses of a directive: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['in the text', '<p>la'],
    ['in an interpolation', '<p>{ la'],
    ['on a tag name', '<my-ch'],
    ['on a directive selector', '<my-child @@to'],
    ['in a condition', '<my-child @if (la'],
    ['after the = of an attribute', '<my-child label='],
    ['after the quote opening a value', '<my-child label="'],
    ['in an attribute value', '<my-child label="la'],
    ['after the ) of an event', '<my-child (picked)'],
    ['in an event handler', '<my-child (picked)="la'],
    ['after an error', '<my-child @la']
  ])('finds nothing %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});
