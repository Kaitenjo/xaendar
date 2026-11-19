import { describe, expect, it } from 'vitest';
import { libraryReadmeMd } from './library-readme-md';

describe('libraryReadmeMd()', () => {
  it('tells how the library is imported, extended, tested and built', () => {
    const readme = libraryReadmeMd({ name: '@acme/ui', folder: 'ui', ssr: false });

    expect(readme.startsWith('# @acme/ui\n')).toBe(true);
    expect(readme).toContain('@import { … } from \'@acme/ui\'');
    expect(readme).toContain('xd generate component <name> --library @acme/ui');
    expect(readme).toContain('xd build @acme/ui` compiles it into `dist/ui`');
  });
});
