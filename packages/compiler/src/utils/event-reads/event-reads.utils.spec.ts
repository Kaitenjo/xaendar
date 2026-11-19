import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../parser/utils/expression-validator/expression-validator';
import { readsEvent } from './event-reads.utils';

const reads = (source: string) => readsEvent(validateExpression(source).node);

describe('readsEvent', () => {
  it.each([
    ['$event'],
    ['$event.target'],
    ['$event?.detail.value'],
    ['format($event.detail, 2)'],
    ['$event.key === \'Enter\''],
    ['{ $event }'],
    ['{ value: $event.target }'],
    ['[$event]']
  ])('finds the read of $event in %s', source => {
    expect(reads(source)).toBe(true);
  });

  it.each([
    ['item'],
    ['item.$event'],
    ['{ $event: 1 }'],
    ['format(a, \'$event\')'],
    ['$even']
  ])('finds no read of $event in %s', source => {
    expect(reads(source)).toBe(false);
  });
});
