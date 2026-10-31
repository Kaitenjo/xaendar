import { describe, expect, it } from 'vitest';
import { CLIENT_RENDERING, SERVER_RENDERING } from '../../rendering/rendering';
import { xaendarJson } from './xaendar-json';

describe('xaendarJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(xaendarJson('my-app', 'scss', CLIENT_RENDERING))).not.toThrow();
  });

  it('sets the project name and chosen component style', () => {
    const result = JSON.parse(xaendarJson('my-app', 'scss', CLIENT_RENDERING));

    expect(result.name).toBe('my-app');
    expect(result.generate.components.style).toBe('scss');
    expect(result.ssr).toBeUndefined();
  });

  it('declares the entry of the rendering on the server and the routes to prerender of a project rendering on the server', () => {
    const result = JSON.parse(xaendarJson('my-app', 'css', SERVER_RENDERING));

    expect(result.ssr).toEqual({ entry: 'src/entry-server', prerender: ['/'] });
  });
});
