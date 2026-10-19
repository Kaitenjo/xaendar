import { describe, expect, it } from 'vitest';
import { loadPreprocessor } from './load-preprocessor.utils';

describe('loadPreprocessor()', () => {
  it('returns the module of the package', async () => {
    const module = { compile: () => '' };

    await expect(loadPreprocessor('sass', async () => module, '/src/a.scss')).resolves.toBe(module);
  });

  it('throws an error asking to install the package when it cannot be imported, keeping the original error as cause', async () => {
    const cause = new Error('Cannot find package \'sass\'');

    const promise = loadPreprocessor('sass', () => Promise.reject(cause), '/src/a.scss');

    await expect(promise).rejects.toThrow('The "sass" package is required to compile /src/a.scss: install it with "npm i -D sass".');
    await expect(promise).rejects.toHaveProperty('cause', cause);
  });
});
