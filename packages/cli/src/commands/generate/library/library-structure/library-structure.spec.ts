import { describe, expect, it } from 'vitest';
import { buildLibraryStructure } from './library-structure';

describe('buildLibraryStructure()', () => {
  it('builds the package, the TypeScript project and the sources of the library, its entry exporting its example component', () => {
    const entries = buildLibraryStructure({ name: '@acme/ui', folder: 'ui', ssr: false }, '1.2.3');

    expect(entries.map(entry => [entry.type, entry.name])).toEqual([
      ['file', 'package.json'],
      ['file', 'tsconfig.json'],
      ['file', 'README.md'],
      ['directory', 'src']
    ]);
    expect((entries[0] as { content: string }).content).toContain('"@xaendar/core": "^1.2.3"');
    expect((entries[3] as { children: unknown[] }).children).toEqual([
      { type: 'file', name: 'public-api.ts', content: 'export * from \'./ui-example/ui-example.xd.component\';\n' },
      { type: 'generateComponent', name: 'ui-example' }
    ]);
  });
});
