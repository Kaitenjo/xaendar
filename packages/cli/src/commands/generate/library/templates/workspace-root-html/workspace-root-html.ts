import { toComponentClassName } from '../../../../../utils/component-class-name/component-class-name.utils';
import type { WorkspaceLibrary } from '../../../../../types/workspace-library.type';
import { getExampleComponentName } from '../../../../../utils/library/library.utils';

/**
 * Generates the template of the root component of the project testing a new library: it renders the example component
 * of the library, imported by the name of its package, as an application installing the library does.
 *
 * @param componentName - The name of the root component.
 * @param library - The library.
 * @returns The template.
 */
export function workspaceRootHtml(componentName: string, { name, folder }: WorkspaceLibrary): string {
  const example = getExampleComponentName(folder);
  return `@import { ${toComponentClassName(example)} } from '${name}'

<p>${componentName} works!</p>
<${example} />
`;
}
