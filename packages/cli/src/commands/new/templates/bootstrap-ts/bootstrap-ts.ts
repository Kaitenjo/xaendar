import { toPascalCase } from '@xaendar/common';

/**
 * Generates the content of the project module `src/bootstrap.ts`, loaded by `main.ts` once the
 * Signal polyfill is installed.
 *
 * @param componentName - The root component name derived from the project
 *   name (e.g. `app` → `'./app/app.xd.component'`).
 * @returns The formatted TypeScript source string.
 */
export function bootstrapTs(componentName: string): string {
  const componentClassName = `${toPascalCase(componentName)}Component`;
  return `import { ${componentClassName} } from './${componentName}/${componentName}.xd.component';

console.log(${componentClassName});`;
}
