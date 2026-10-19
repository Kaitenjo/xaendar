/**
 * Loads the package of a stylesheet preprocessor, which the project installs only when it uses that preprocessor.
 *
 * @param name - The name of the package, reported in the error message.
 * @param load - Imports the package.
 * @param entryPath - Path of the stylesheet that needs the preprocessor, reported in the error message.
 * @returns The module of the package.
 * @throws If the package cannot be imported, typically because it is not installed.
 */
export async function loadPreprocessor<TModule>(name: string, load: () => Promise<TModule>, entryPath: string): Promise<TModule> {
  try {
    return await load();
  } catch (error) {
    throw new Error(`The "${name}" package is required to compile ${entryPath}: install it with "npm i -D ${name}".`, { cause: error });
  }
}
