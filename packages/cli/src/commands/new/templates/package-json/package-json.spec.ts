import { describe, expect, it } from 'vitest';
import { CLIENT_RENDERING, SERVER_RENDERING } from '../../rendering/rendering';
import { packageJson } from './package-json';

describe('packageJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(packageJson('my-app', '1.2.3', 'css', CLIENT_RENDERING))).not.toThrow();
  });

  it('sets the project name', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css', CLIENT_RENDERING));

    expect(result.name).toBe('my-app');
  });

  it('pins the Xaendar dependencies to the given version', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css', CLIENT_RENDERING));

    expect(result.dependencies['@xaendar/core']).toBe('^1.2.3');
    expect(result.dependencies['@xaendar/signals']).toBe('^1.2.3');
    expect(result.dependencies['@xaendar/types']).toBe('^1.2.3');
    expect(result.devDependencies['@xaendar/cli']).toBe('^1.2.3');
  });

  it('runs the tests through xd test, which needs a DOM environment', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css', CLIENT_RENDERING));

    expect(result.scripts.test).toBe('xd test');
    expect(result.devDependencies['happy-dom']).toBeDefined();
  });

  it('adds no preprocessor for css', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css', CLIENT_RENDERING));

    expect(result.devDependencies.sass).toBeUndefined();
    expect(result.devDependencies.less).toBeUndefined();
  });

  it('adds nothing of the rendering on the server by default', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'css', CLIENT_RENDERING));

    expect(result.dependencies['@xaendar/ssr']).toBeUndefined();
    expect(result.scripts.serve).toBeUndefined();
  });

  it('adds @xaendar/ssr, the types of Node and the scripts serving and prerendering a project rendering on the server, keeping them sorted', () => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', 'scss', SERVER_RENDERING));

    expect(result.dependencies['@xaendar/ssr']).toBe('^1.2.3');
    expect(result.devDependencies['@types/node']).toMatch(/^\^\d/);
    expect(result.scripts.serve).toBe('node server.ts');
    expect(result.scripts.prerender).toBe('xd prerender');
    for (const field of ['scripts', 'dependencies', 'devDependencies']) {
      const names = Object.keys(result[field]);
      expect(names).toEqual([...names].sort());
    }
  });

  it.each([['scss', 'sass'], ['sass', 'sass'], ['less', 'less']] as const)('adds the compiler of %s, %s, to the dev dependencies, keeping them sorted', (style, preprocessor) => {
    const result = JSON.parse(packageJson('my-app', '1.2.3', style, CLIENT_RENDERING));
    const names = Object.keys(result.devDependencies);

    expect(result.devDependencies[preprocessor]).toMatch(/^\^\d/);
    expect(names).toEqual([...names].sort());
  });
});
