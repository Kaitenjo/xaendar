import type { Entry } from '../../../../types/entry.type';
import type { WorkspaceLibrary } from '../../../../types/workspace-library.type';
import { getExampleComponentName } from '../../../../utils/library/library.utils';
import { libraryPackageJson } from '../templates/library-package-json/library-package-json';
import { libraryReadmeMd } from '../templates/library-readme-md/library-readme-md';
import { libraryTsconfigJson } from '../templates/library-tsconfig-json/library-tsconfig-json';
import { publicApiTs } from '../templates/public-api-ts/public-api-ts';

/**
 * Builds the entries of the folder of a new library: its `package.json`, its `tsconfig.json`, its `README.md`, and its
 * sources, with the entry of its package (`src/public-api.ts`) exporting its example component.
 *
 * @param library - The library.
 * @param version - The version of the Xaendar packages, read from the `package.json` of the CLI.
 * @returns The entries, to write in the folder of the library.
 */
export function buildLibraryStructure(library: WorkspaceLibrary, version: string): Entry[] {
  const example = getExampleComponentName(library.folder);
  return [
    { type: 'file', name: 'package.json', content: libraryPackageJson(library, version) },
    { type: 'file', name: 'tsconfig.json', content: libraryTsconfigJson() },
    { type: 'file', name: 'README.md', content: libraryReadmeMd(library) },
    {
      type: 'directory',
      name: 'src',
      children: [
        { type: 'file', name: 'public-api.ts', content: publicApiTs(example) },
        { type: 'generateComponent', name: example }
      ]
    }
  ];
}
