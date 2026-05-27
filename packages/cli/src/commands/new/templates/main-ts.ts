import { toPascalCase } from '../../../utils/case.utils';

/**
 * Generates the content of the project entry point `src/main.ts`.
 *
 * @param componentName - The root component name derived from the project
 *   name (e.g. `app` → `'./app/app.xd.component'`).
 * @returns The formatted TypeScript source string.
 */
export function mainTs(componentName: string): string {
  const componentClassName = `${toPascalCase(componentName)}Component`;
  return `import { ${componentClassName} } from './${componentName}/${componentName}.xd.component';

console.log(${componentClassName});`;
}
