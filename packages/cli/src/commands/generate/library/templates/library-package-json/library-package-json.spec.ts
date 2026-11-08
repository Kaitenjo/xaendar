import { describe, expect, it } from 'vitest';
import { libraryPackageJson } from './library-package-json';

describe('libraryPackageJson()', () => {
  it('names the package, and takes @xaendar/core from the application at the version of the CLI', () => {
    expect(JSON.parse(libraryPackageJson({ name: '@acme/ui', folder: 'ui', ssr: false }, '1.2.3'))).toEqual({
      name: '@acme/ui',
      version: '0.0.0',
      type: 'module',
      peerDependencies: { '@xaendar/core': '^1.2.3' }
    });
  });
});
