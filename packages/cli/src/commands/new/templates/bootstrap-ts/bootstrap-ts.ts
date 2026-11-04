/**
 * Generates the content of the project module `src/bootstrap.ts`, loaded by `main.ts` once the
 * Signal polyfill is installed. The root component is imported for its effects: nothing reads its class, so that a static
 * one can stay the HTML of the server.
 *
 * @param componentName - The root component name derived from the project
 *   name (e.g. `app` → `'./app/app.xd.component'`).
 * @returns The formatted TypeScript source string.
 */
export function bootstrapTs(componentName: string): string {
  return `import './${componentName}/${componentName}.xd.component';`;
}
