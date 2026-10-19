import { describe, expect, it } from 'vitest';
import { packageJson } from './package-json';

describe('packageJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(packageJson('my-app', '1.2.3', 'css'))).not.toThrow();
  });

  it('sets the project name', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css'));

    expect(result.name).toBe('my-app');
  });

  it('pins the Xaendar dependencies to the given version', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css'));

    expect(result.dependencies['@xaendar/core']).toBe('^1.2.3');
    expect(result.dependencies['@xaendar/signals']).toBe('^1.2.3');
    expect(result.dependencies['@xaendar/types']).toBe('^1.2.3');
    expect(result.devDependencies['@xaendar/cli']).toBe('^1.2.3');
  });

  it('runs the tests through xd test, which needs a DOM environment', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css'));

    expect(result.scripts.test).toBe('xd test');
    expect(result.devDependencies['happy-dom']).toBeDefined();
  });

  it('adds no preprocessor for css', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css'));

    expect(result.devDependencies.sass).toBeUndefined();
    expect(result.devDependencies.less).toBeUndefined();
  });

  it.each([['scss', 'sass'], ['sass', 'sass'], ['less', 'less']] as const)('adds the compiler of %s, %s, to the dev dependencies, keeping them sorted', (style, preprocessor) => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', style));
    const names = Object.keys(result.devDependencies);

    expect(result.devDependencies[preprocessor]).toMatch(/^\^\d/);
    expect(names).toEqual([...names].sort());
  });
});
