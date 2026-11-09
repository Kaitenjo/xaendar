import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../parser/utils/expression-validator/expression-validator';
import { collectReads } from './expression-reads.utils';

const readsOf = (expression: string) => collectReads(validateExpression(expression).node).map(read => read.text);

describe('collectReads', () => {
  it('collects the identifiers reading a name, in the order they are written', () => {
    expect(readsOf('format(item().value, $index) + offset')).toEqual(['format', 'item', '$index', 'offset']);
  });

  it('leaves out the names of the members and of the properties of an object literal', () => {
    expect(readsOf('{ name: row.label, $index }')).toEqual(['row', '$index']);
  });

  it('leaves out the types of the casts', () => {
    expect(readsOf('format(value as Date)')).toEqual(['format', 'value']);
  });
});
