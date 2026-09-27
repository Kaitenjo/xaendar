import { describe, expect, it } from 'vitest';
import { xaendarJson } from './xaendar-json';

describe('xaendarJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(xaendarJson('my-app', 'scss'))).not.toThrow();
  });

  it('sets the project name and chosen component style', () => {
    const result = JSON.parse(xaendarJson('my-app', 'scss'));

    expect(result.name).toBe('my-app');
    expect(result.generate.components.style).toBe('scss');
  });
});
