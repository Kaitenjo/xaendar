import { describe, expect, it } from 'vitest';
import { packageJson } from './package-json';

describe('packageJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(packageJson('my-app', '1.2.3'))).not.toThrow();
  });

  it('sets the project name', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3'));

    expect(result.name).toBe('my-app');
  });

  it('pins the Xaendar dependencies to the given version', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3'));

    expect(result.dependencies['@xaendar/core']).toBe('^1.2.3');
    expect(result.dependencies['@xaendar/signals']).toBe('^1.2.3');
    expect(result.dependencies['@xaendar/types']).toBe('^1.2.3');
    expect(result.devDependencies['@xaendar/cli']).toBe('^1.2.3');
  });
});
