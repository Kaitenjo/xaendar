import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEV_MODE, readDevMode } from './dev-mode.util';

describe('readDevMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is on when NODE_ENV is not production, as in the tests', () => {
    expect(DEV_MODE).toBe(true);
    vi.stubEnv('NODE_ENV', 'development');
    expect(readDevMode()).toBe(true);
  });

  it('is off in a build for production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(readDevMode()).toBe(false);
  });

  it('is on when there is no process, as in a page loading the modules without a bundler', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'process')!;
    Reflect.deleteProperty(globalThis, 'process');
    try {
      expect(readDevMode()).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'process', descriptor);
    }
  });
});
