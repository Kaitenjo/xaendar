import { describe, expect, it } from 'vitest';
import type { EventCheck } from '../../types/event-check.type';
import { findEventCheck } from './event-checks.utils';

describe('findEventCheck', () => {
  const check: EventCheck = { span: { start: 5, end: 25 }, nameSpan: { start: 6, end: 14 }, message: 'warning' };
  const typeCheck = { eventChecks: [{ span: { start: 40, end: 50 }, nameSpan: { start: 41, end: 45 }, message: 'other' }, check] };

  it('finds the check of the binding holding the span of a rejected satisfies', () => {
    expect(findEventCheck(typeCheck, { start: 5, end: 25 }, 1360)).toBe(check);
    expect(findEventCheck(typeCheck, { start: 6, end: 14 }, 1360)).toBe(check);
  });

  it('finds none for another error, a span outside of the bindings checked, or a template checking no event', () => {
    expect(findEventCheck(typeCheck, { start: 5, end: 25 }, 2339)).toBeUndefined();
    expect(findEventCheck(typeCheck, { start: 26, end: 30 }, 1360)).toBeUndefined();
    expect(findEventCheck({}, { start: 5, end: 25 }, 1360)).toBeUndefined();
  });
});
