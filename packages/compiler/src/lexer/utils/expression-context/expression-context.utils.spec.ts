import { describe, expect, it } from 'vitest';
import { getExpressionContext } from './expression-context.utils';

const PLACEHOLDER = '__xaendarCompletion__';

/**
 * Returns the expression context at the `|` marking the offset of a template, as `kind@start-end: source`.
 */
const contextOf = (template: string) => {
  const context = getExpressionContext(template.replace('|', ''), template.indexOf('|'));
  return context && `${context.kind}@${context.span.start}-${context.span.end}: ${context.source.replaceAll(PLACEHOLDER, 'P')}`;
};

describe('getExpressionContext', () => {
  it.each([
    ['nothing written yet', '<b>{|</b>', 'interpolation@4-4: <b>{P }</b>'],
    ['nothing written in a closed interpolation', '<b>{ | }</b>', 'interpolation@5-5: <b>{ P }</b>'],
    ['a partial identifier', '<b>{ ti|</b>', 'interpolation@5-7: <b>{ ti }</b>'],
    ['a member after a dot', '<b>{ item.| }</b>', 'interpolation@10-10: <b>{ item.P }</b>'],
    ['the rest of the expression dropped', '<b>{ ti|tle + 1 }</b>{ x }', 'interpolation@5-7: <b>{ ti }</b>{ x }'],
    ['the constructs left open closed', '<b>{ pick([a, { b: c(|</b>', 'interpolation@21-21: <b>{ pick([a, { b: c(P)}]) }</b>'],
    ['a substitution of a template literal', '<b>{ `a${ b| }` }</b>', 'interpolation@10-11: <b>{ `a${ b}` }</b>'],
    ['the braces and strings after the offset', '<b>{ a| + { b: \'}\' }.b }</b>', 'interpolation@5-6: <b>{ a }</b>'],
    ['an escaped quote after the offset', '<b>{ a| + \'\\\'}\' }</b>', 'interpolation@5-6: <b>{ a }</b>'],
    ['an escaped backtick after the offset', '<b>{ a| + `\\`}` }</b>', 'interpolation@5-6: <b>{ a }</b>'],
    ['the value of an attribute', '<b title="{ ti|"></b>', 'interpolation@12-14: <b title="{ ti }"></b>'],
    ['the value of an attribute of a directive', '<b @@tooltip(text="{ |")></b>', 'interpolation@21-21: <b @@tooltip(text="{ P }")></b>'],
    ['an interpolation after text', '<b>hello { |</b>', 'interpolation@11-11: <b>hello { P }</b>'],
    ['an interpolation starting the template', '{ |', 'interpolation@2-2: { P }'],
    ['a parenthesis closing nothing', '<b>{ a) + |</b>', 'interpolation@10-10: <b>{ a) + P }</b>']
  ])('closes an interpolation: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['nothing written yet', '<b (click)="|">x</b>', 'handler@12-12: <b (click)="P()">x</b>'],
    ['a partial name', '<b (click)="se|">x</b>', 'handler@12-14: <b (click)="se()">x</b>'],
    ['the arguments after the offset dropped', '<b (click)="se|lect($event)">x</b>', 'handler@12-14: <b (click)="se()">x</b>'],
    ['the event of a directive', '<b @@tooltip((shown)="|")>x</b>', 'handler@22-22: <b @@tooltip((shown)="P()")>x</b>']
  ])('closes the call of an event on the name of its method: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['nothing written yet', '<b (click)="pick(|)">x</b>', 'argument@17-17: <b (click)="pick(P, $event)">x</b>'],
    ['nothing written in an unclosed call', '<b (click)="pick(|">x</b>', 'argument@17-17: <b (click)="pick(P, $event)">x</b>'],
    ['the beginning of $event', '<b (click)="pick($e|)">x</b>', 'argument@17-19: <b (click)="pick($e, $event)">x</b>'],
    ['a following argument', '<b (click)="pick(a, |)">x</b>', 'argument@20-20: <b (click)="pick(a, P, $event)">x</b>'],
    ['a call in an argument', '<b (click)="pick(fn(|)">x</b>', 'argument@20-20: <b (click)="pick(fn(P), $event)">x</b>'],
    ['an argument after a closed call', '<b (click)="pick(fn(a), |)">x</b>', 'argument@24-24: <b (click)="pick(fn(a), P, $event)">x</b>']
  ])('closes the arguments of the method of an event: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['nothing written in a @if without block', '@if (|', 'condition@5-5: @if (P) {}'],
    ['a partial identifier, the rest of the condition dropped', '@if (ti|tle && ok) {\n}', 'condition@5-7: @if (ti) {\n}'],
    ['the template after a condition without block', '@if (|)\n<p></p>', 'condition@5-5: @if (P) {}\n<p></p>'],
    ['a @else if', '@if (a) {\n} @else if (|', 'condition@22-22: @if (a) {\n} @else if (P) {}'],
    ['the iterable of a @for', '@for (item of |', 'condition@14-14: @for (item of P) {}'],
    ['the track of a @for', '@for (item of items; track |) {\n}', 'condition@27-27: @for (item of items; track P) {\n}'],
    ['the track of a @for without item', '@for (10; track |) {\n}', 'condition@16-16: @for (10; track P) {\n}'],
    ['a @switch', '@switch (|) {\n}', 'condition@9-9: @switch (P) {\n}'],
    ['a call left open', '@if (fn(|', 'condition@8-8: @if (fn(P)) {}'],
    ['a conditional binding', '<b @if (|) { title="x" }></b>', 'condition@8-8: <b @if (P) { title="x" }></b>']
  ])('closes the condition of a block: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['nothing written', '@render row(|', 'render@12-12: @render row(P)'],
    ['a partial identifier, the rest of the arguments dropped', '@render row(a, ti|tle, b)\n<p></p>', 'render@15-17: @render row(a, ti)\n<p></p>'],
    ['a call left open', '@render row(fn(|', 'render@15-15: @render row(fn(P))']
  ])('closes the arguments of a @render: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['plain text', 'hello|'],
    ['the name of an attribute', '<b ti|'],
    ['a static attribute value', '<b title="a|"></b>'],
    ['a template that cannot be lexed', '<b (click="|'],
    ['a string in an interpolation', '<b>{ \'a| }</b>'],
    ['an escaped quote in a string', '<b>{ \'\\\'| }</b>'],
    ['the text of a template literal', '<b>{ `a| }</b>'],
    ['an escaped backtick in a template literal', '<b>{ `\\`| }</b>'],
    ['a handler not closed by a double quote', '<b (click)="se|'],
    ['a method read from an object', '<b (click)="a.b|">x</b>'],
    ['a string in an argument', '<b (click)="pick(\'a|\')">x</b>'],
    ['a block keyword before its condition', '@if  |'],
    ['the item of a @for', '@for (|'],
    ['the partial item of a @for', '@for (ite|'],
    ['the item of a @for before its of', '@for (item |'],
    ['a string in a condition', '@if (\'a|'],
    ['the name of the template of a @render', '@render ro|'],
    ['a string in the arguments of a @render', '@render row(\'a|']
  ])('finds no expression in %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});
