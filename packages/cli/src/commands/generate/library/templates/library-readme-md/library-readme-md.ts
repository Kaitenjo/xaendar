import type { WorkspaceLibrary } from '../../../../../types/workspace-library.type';

/**
 * Generates the content of the `README.md` of a library, telling how it is developed in its workspace.
 *
 * @param library - The library.
 * @returns The Markdown text.
 */
export function libraryReadmeMd({ name, folder }: WorkspaceLibrary): string {
  return `# ${name}

A library of Xaendar components and directives. The project at the root of the workspace imports it from its sources,
by the name of its package: \`@import { … } from '${name}'\`.

- \`xd generate component <name> --library ${name}\` adds a component to it, exported by \`src/public-api.ts\`.
- \`xd test\` runs its specs, with the ones of the workspace.
- \`xd build ${name}\` compiles it into \`dist/${folder}\`, the folder to publish with \`npm publish\`.
`;
}
