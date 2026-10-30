import { describe, expect, it } from 'vitest';
import { isServerRendering } from './server-rendering.utils';

const server = { environment: { config: { consumer: 'server' } } };
const client = { environment: { config: { consumer: 'client' } } };

describe('isServerRendering', () => {
  it('is true for an environment of the server when the plugin renders on the server', () => {
    expect(isServerRendering({ ssr: { entry: 'src/entry-server.ts' } }, server)).toBe(true);
  });

  it('is false for an environment of the browser, or without one', () => {
    expect(isServerRendering({ ssr: { entry: 'src/entry-server.ts' } }, client)).toBe(false);
    expect(isServerRendering({ ssr: { entry: 'src/entry-server.ts' } }, {})).toBe(false);
  });

  it('is false when the plugin does not render on the server', () => {
    expect(isServerRendering({}, server)).toBe(false);
  });
});
