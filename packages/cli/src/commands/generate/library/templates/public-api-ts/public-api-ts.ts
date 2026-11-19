/**
 * Generates the content of `src/public-api.ts` of a new library: the entry of its package, exporting its example
 * component. `xd generate component --library` adds an export for each component it creates.
 *
 * @param componentName - The name of the example component.
 * @returns The TypeScript source.
 */
export function publicApiTs(componentName: string): string {
  return `export * from './${componentName}/${componentName}.xd.component';\n`;
}
