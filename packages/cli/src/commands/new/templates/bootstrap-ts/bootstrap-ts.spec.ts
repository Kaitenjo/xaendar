import { describe, expect, it } from 'vitest';
import { bootstrapTs } from './bootstrap-ts';

describe('bootstrapTs()', () => {
  it('imports the module of the root component for its effects', () => {
    expect(bootstrapTs('my-app-root')).toBe('import \'./my-app-root/my-app-root.xd.component\';');
  });
});
