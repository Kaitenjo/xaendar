import { describe, expect, it } from 'vitest';
import { tsconfigJson } from './tsconfig-json';

describe('tsconfigJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(tsconfigJson())).not.toThrow();
  });

  it('targets bundler module resolution and excludes spec files', () => {
    const result = JSON.parse(tsconfigJson());

    expect(result.compilerOptions.moduleResolution).toBe('bundler');
    expect(result.exclude).toContain('**/*.spec.ts');
  });
});
