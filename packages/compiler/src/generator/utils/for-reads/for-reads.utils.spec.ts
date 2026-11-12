import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import type { ForNode } from '../../../parser/types/nodes/for-node.type';
import { getReadForVariables, writeIterationVariables } from './for-reads.utils';

const readIn = (template: string) => getReadForVariables(parseTemplate(template)[0] as ForNode);

describe('getReadForVariables', () => {
  it('returns no variable for a body reading none', () => {
    expect(readIn('@for (item of items(); track item.id) { <li>text</li> }')).toEqual([]);
  });

  it('returns the item first, then the implicit variables in their order, whatever the order of the reads', () => {
    expect(readIn('@for (item of items(); track item.id) { { $odd } { $index } { item } { $last } { $even } { $first } }')).toEqual(['item', '$index', '$first', '$last', '$even', '$odd']);
  });

  it('reads the variables by their aliases, not by their own names', () => {
    expect(readIn('@for (item of items(); track item.id; i = $index) { { i } { $index } }')).toEqual(['$index']);
  });

  it('returns no item for a @for declaring none', () => {
    expect(readIn('@for (3; track $index) { { item } }')).toEqual([]);
  });

  it('counts a member or a property of an object literal named as a variable as no read', () => {
    expect(readIn('@for (item of items(); track item.id) { { row.$index } <x-c data="{ ({ $first: 1 }) }" /> }')).toEqual([]);
  });

  it('reads the attributes, the class bindings, the conditional bindings, the directives and the events', () => {
    const template = '@for (item of items(); track item.id) { <li title="{item}" [class.a]="{$first}" @if ($last) { b="1" } @@tip(text="{$even}") (click)="pick($odd)"></li> }';
    expect(readIn(template)).toEqual(['item', '$first', '$last', '$even', '$odd']);
  });

  it('reads the handlers of the events, the templates the @render blocks call and the conditions of the @case', () => {
    expect(readIn('@for (item of items(); track item.id) { <b (click)="item.set(1)"></b> }')).toEqual(['item']);
    expect(readIn('@for (item of items(); track item.id) { @render item() }')).toEqual(['item']);
    expect(readIn('@for (item of items(); track item.id) { @switch (1) { @case (\'x\', $even) { a } @default { b } } }')).toEqual(['$even']);
  });

  it('reads the blocks, the triggers, the @let, the templates and the nested @for blocks, their track expressions included', () => {
    expect(readIn('@for (item of items(); track item.id) { @let total = $index + 1; }')).toEqual(['$index']);
    expect(readIn('@for (item of items(); track item.id) { <template row(label = $first)>{ label }</template> }')).toEqual(['$first']);
    expect(readIn('@for (item of items(); track item.id) { @defer (when $last) { a } }')).toEqual(['$last']);
    expect(readIn('@for (item of items(); track item.id) { @for (cell of cells(); track item.id + cell.id) { c } }')).toEqual(['item']);
  });
});

describe('writeIterationVariables', () => {
  /**
   * Writes the variables a @for body reads.
   */
  const writeIn = (template: string) => {
    const node = parseTemplate(template)[0] as ForNode;
    const read = getReadForVariables(node);
    return writeIterationVariables(read, read.map((_variable, index) => 10 + index));
  };

  it('writes the variables read, and the identifier of each one at the same index', () => {
    expect(writeIn('@for (row of rows(); track row.id) { { $last } { row.name } }')).toBe('{ used: [\'item\', \'$last\'], ids: [10, 11] }');
  });

  it('reads the implicit variables through their aliases', () => {
    expect(writeIn('@for (row of rows(); track row.id; i = $index, odd = $odd) { { odd } { i } }')).toBe('{ used: [\'$index\', \'$odd\'], ids: [10, 11] }');
  });

  it('writes only the implicit variables of a @for declaring no item', () => {
    expect(writeIn('@for (10; track $index) { { $index } { $first } }')).toBe('{ used: [\'$index\', \'$first\'], ids: [10, 11] }');
  });
});
