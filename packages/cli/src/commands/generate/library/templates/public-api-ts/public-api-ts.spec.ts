import { describe, expect, it } from 'vitest';
import { publicApiTs } from './public-api-ts';

describe('publicApiTs()', () => {
  it('exports the example component of the library', () => {
    expect(publicApiTs('ui-example')).toBe('export * from \'./ui-example/ui-example.xd.component\';\n');
  });
});
