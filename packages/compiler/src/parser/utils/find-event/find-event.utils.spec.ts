import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import { findEvent } from './find-event.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('findEvent', () => {
  it.each([
    ['on an element', '<a (x)="f()"></a>'],
    ['on a child', '<a><b (x)="f()"></b></a>'],
    ['in a later sibling', '<a></a><b (x)="f()"></b>'],
    ['in a @if', '@if (a) { <b (x)="f()"></b> }'],
    ['in a @else if', '@if (a) { } @else if (b) { <b (x)="f()"></b> }'],
    ['in a @else', '@if (a) { } @else { <b (x)="f()"></b> }'],
    ['in a @for', '@for (item of items; track item()) { <b (x)="f()"></b> }'],
    ['in a @case', '@switch (a) { @case (1) { <b (x)="f()"></b> } }'],
    ['in a @default', '@switch (a) { @default { <b (x)="f()"></b> } }'],
    ['in a template', '<template row()><b (x)="f()"></b></template>'],
    ['in a @hydrate', '@hydrate (idle) { <b (x)="f()"></b> }'],
    ['in a @client', '@client { <b (x)="f()"></b> }'],
    ['in a conditional binding', '<a @if (b) { (x)="f()" }></a>'],
    ['in a later branch of a conditional binding', '<a @if (b) { c="1" } @else { (x)="f()" }></a>'],
    ['in a @switch binding', '<a @switch (b) { @case (1) { (x)="f()" } }></a>'],
    ['in a conditional binding of a conditional binding', '<a @if (b) { @if (c) { (x)="f()" } }></a>'],
    ['on a directive', '<a @@tip((x)="f()")></a>'],
    ['on a later directive', '<a @@tip @@other((x)="f()")></a>'],
    ['in a conditional binding of a directive', '<a @@tip(@if (b) { (x)="f()" })></a>'],
    ['on a directive of a conditional binding', '<a @if (b) { @@tip((x)="f()") }></a>']
  ])('finds a listener %s', (_case, template) => {
    expect(findEvent(parse(template))).toMatchObject({ name: 'x' });
  });

  it.each([
    ['in nodes without listeners', '<a b="1" c="{d}"><p>text { e }</p></a>'],
    ['in the bindings of an element without listeners', '<a @if (b) { c="1" } @@tip(d="1")></a>'],
    ['in a @if without an alternate', '@if (a) { <b></b> }'],
    ['in a @render, a @let and an interpolation', '@let a = 1; { a } @render row()']
  ])('finds nothing %s', (_case, template) => {
    expect(findEvent(parse(template))).toBeUndefined();
  });
});
