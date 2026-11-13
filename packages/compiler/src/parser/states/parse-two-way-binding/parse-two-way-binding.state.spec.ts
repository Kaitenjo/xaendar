import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { ElementNode } from '../../types/nodes/element-node.type';
import type { InterpolationNode } from '../../types/nodes/interpolation-node.type';
import { getTemplateSpan } from '../../utils/expression-validator/expression-validator';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];

describe('parseTwoWayBinding', () => {
  it('parses a two-way binding into the input bound to the value of the signal and the listener writing it', () => {
    const template = '<x-counter [(value)]="count" />';
    const [node] = parse(template);
    const [attribute] = node.attributes;
    const [event] = node.events;

    expect(attribute).toMatchObject({ type: ASTNodeType.Attribute, name: 'value', nameSpan: { start: 13, end: 18 }, span: { start: 11, end: 28 }, twoWay: true });
    expect((attribute.value as InterpolationNode).expression.getText()).toBe('count()');
    expect((attribute.value as InterpolationNode).span).toEqual({ start: 22, end: 27 });
    expect(event).toMatchObject({ type: ASTNodeType.Event, name: 'valueChange', nameSpan: { start: 13, end: 18 }, handler: 'count.set', handlerSpan: { start: 22, end: 27 }, span: { start: 11, end: 28 }, twoWay: true });
    expect(event.parameters.map(parameter => parameter.getText())).toEqual(['$event.detail']);
  });

  it('maps the signal read by the input onto the template', () => {
    const template = '<x-counter [(value)]="form.count" />';
    const [node] = parse(template);
    const call = (node.attributes[0].value as InterpolationNode).expression as unknown as { expression: Parameters<typeof getTemplateSpan>[0] };

    expect(getTemplateSpan(call.expression)).toEqual({ start: 22, end: 32 });
  });

  it('names a variable, a member or one of their properties, read by key too, around spaces', () => {
    const [node] = parse('<x-counter [(value)]=" rows[0].count " />');

    expect(node.events[0].handler).toBe('rows[0].count.set');
    expect((node.attributes[0].value as InterpolationNode).expression.getText()).toBe('rows[0].count()');
  });

  it('parses the two-way bindings of a branch of a conditional binding and of a directive', () => {
    const [node] = parse('<x-counter @if (a) { [(value)]="count" } @@tracked([(on)]="flag") />');
    const [branch] = node.conditionalBindings[0].branches;
    const [directive] = node.directives;

    expect(branch.attributes.map(({ name, twoWay }) => [name, twoWay])).toEqual([['value', true]]);
    expect(branch.events.map(({ name, twoWay }) => [name, twoWay])).toEqual([['valueChange', true]]);
    expect(directive.attributes.map(({ name, twoWay }) => [name, twoWay])).toEqual([['on', true]]);
    expect(directive.events.map(({ name, handler }) => [name, handler])).toEqual([['onChange', 'flag.set']]);
  });

  it('keeps the attributes of a directive that are not two-way bindings', () => {
    const [node] = parse('<div @@tracked(label="x") />');

    expect(node.directives[0].attributes.map(({ name, twoWay }) => [name, twoWay])).toEqual([['label', undefined]]);
  });

  it('rejects a binding of the same input and a two-way binding of it', () => {
    expect(() => parse('<x-counter value="{1}" [(value)]="count" />')).toThrow('Attribute "value" is bound more than once on <x-counter>');
  });

  it.each([
    ['an empty name', '<x-counter [()]="count" />', '"[()]" is not a two-way binding: write [(name)]="signal"'],
    ['a name followed by more', '<x-counter [(value)x]="count" />', '"[(value)x]" is not a two-way binding'],
    ['a name with a bracket', '<x-counter [(va[l)]="count" />', '"[(va[l)]" is not a two-way binding']
  ])('rejects %s', (_name, template, message) => {
    expect(() => parse(template)).toThrow(message);
  });

  it.each([
    ['without a value', '<x-counter [(value)] />'],
    ['with an interpolation', '<x-counter [(value)]="{count}" />'],
    ['with an empty value', '<x-counter [(value)]=" " />']
  ])('rejects a two-way binding %s', (_name, template) => {
    expect(() => parse(template)).toThrow('[(value)] binds a writable signal, named without braces nor call: [(value)]="signal"');
  });

  it.each([
    ['a call', 'count()'],
    ['an optional chaining', 'form?.count'],
    ['a literal', '1'],
    ['an operator', 'a + b']
  ])('rejects a value naming no signal: %s', (_name, value) => {
    expect(() => parse(`<x-counter [(value)]="${value}" />`)).toThrow('[(value)] binds a writable signal, named without braces nor call: a member, a variable of the template or one of their properties, e.g. [(value)]="count"');
  });
});
