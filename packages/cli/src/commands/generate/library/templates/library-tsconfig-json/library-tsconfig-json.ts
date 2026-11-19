/**
 * Generates the content of the `tsconfig.json` of a library: the options of the workspace, with its `paths`, for the
 * sources of the library only, so that the editor checks its files in a project of their own.
 *
 * @returns The formatted JSON string.
 */
export function libraryTsconfigJson(): string {
  return `${JSON.stringify({
    extends: '../../tsconfig.json',
    include: ['src/**/*.ts']
  }, null, 2)}\n`;
}
