import { describe, expect, it } from 'vitest';
import { parseTemplateParameters } from './template-parameters.utils';

/**
 * The offset of the parameters in the template, as the ones of `<template #row(`.
 */
const OFFSET = 15;

/**
 * Returns the span of a text of the parameters in the template.
 */
const at = (text: string, parameters: string, from = 0) => ({ start: OFFSET + parameters.indexOf(text, from), end: OFFSET + parameters.indexOf(text, from) + text.length });

describe('parseTemplateParameters', () => {
  it('parses each parameter with its name, its type and their spans in the template', () => {
    const text = ' item: Item,\n  render: (value: Map<string, [number]>) => void ';
    expect(parseTemplateParameters(text, OFFSET, 'row')).toEqual([
      { name: 'item', nameSpan: at('item', text), type: 'Item', typeSpan: at('Item', text) },
      { name: 'render', nameSpan: at('render', text), type: '(value: Map<string, [number]>) => void', typeSpan: at('(value: Map<string, [number]>) => void', text) }
    ]);
  });

  it.each([
    ['no parameters', '', []],
    ['only whitespace and comments', ' /* none */ ', []],
    ['a trailing comma', 'item: Item, ', ['item']],
    ['comments between the parameters', 'item: Item /* the row */, index: number', ['item', 'index']]
  ])('accepts %s', (_description, text, names) => {
    expect(parseTemplateParameters(text, OFFSET, 'row').map(({ name }) => name)).toEqual(names);
  });

  it.each([
    ['a missing comma', 'item Item'],
    ['a doubled comma', 'item: Item, , index: number'],
    ['a leading comma', ', item: Item'],
    ['a lone comma', ','],
    ['a semicolon', 'item: Item; index: number'],
    ['a bracket closing nothing', 'item: Item]']
  ])('throws for %s, pointing to the parameters', (_description, text) => {
    expect(() => parseTemplateParameters(text, OFFSET, 'row')).toThrow('The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template #row(item: Item, index: number)>');
    expect(() => parseTemplateParameters(text, OFFSET, 'row')).toThrow(expect.objectContaining({ cause: { start: OFFSET, end: OFFSET + text.length } }));
  });

  it.each([
    ['destructures its value', '{ id }: Item', 'cannot destructure its value'],
    ['is a rest parameter', '...items: Item[]', 'cannot be a rest parameter'],
    ['is optional', 'item?: Item', 'cannot be optional or have a default value'],
    ['has a default value', 'count: number = 1', 'cannot be optional or have a default value'],
    ['has a modifier', 'public item: Item', 'cannot have modifiers or decorators'],
    ['has no type', 'item', 'needs a type, e.g. item: string'],
    ['has an empty type', 'item:', 'needs a type, e.g. item: string']
  ])('throws for a parameter that %s, pointing to it', (_description, text, reason) => {
    const parameters = `index: number, ${text}`;
    expect(() => parseTemplateParameters(parameters, OFFSET, 'row')).toThrow(`The parameter '${text}' of template "row" ${reason}`);
    expect(() => parseTemplateParameters(parameters, OFFSET, 'row')).toThrow(expect.objectContaining({ cause: at(text, parameters) }));
  });

  it.each([
    ['not an identifier', 'this: Item', '\'this\' is not a valid name for a parameter'],
    ['reserved', '$event: Event', '\'$event\' is reserved in templates']
  ])('throws for a name %s', (_description, text, message) => {
    expect(() => parseTemplateParameters(text, OFFSET, 'row')).toThrow(message);
  });

  it('throws for a name declared twice, pointing to the second one', () => {
    const text = 'item: Item, item: number';
    expect(() => parseTemplateParameters(text, OFFSET, 'row')).toThrow('Template "row" declares the parameter "item" more than once');
    expect(() => parseTemplateParameters(text, OFFSET, 'row')).toThrow(expect.objectContaining({ cause: at('item', text, 1) }));
  });
});
