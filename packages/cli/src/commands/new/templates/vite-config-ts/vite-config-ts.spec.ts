import { describe, expect, it } from 'vitest';
import { viteConfigTs } from './vite-config-ts';

describe('viteConfigTs()', () => {
  it('sets src as the project root and opens the dev server on port 4200', () => {
    const result = viteConfigTs();

    expect(result).toContain("root: 'src'");
    expect(result).toContain('open: true');
    expect(result).toContain('port: 4200');
  });
});
