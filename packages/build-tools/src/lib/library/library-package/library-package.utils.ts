import { type ComponentOrDirectiveMetadata, type LibraryManifest, type LibraryManifestDeclaration, listTypeReferences, toLibraryDeclaration } from '@xaendar/compiler';
import { posix } from 'node:path';
import type { Program } from 'typescript';
import type { LibraryAnalysis } from '../../types/library-analysis.type';
import type { LibraryPackageJson } from '../../types/library-package-json.type';
import type { WorkspaceLibrary } from '../../types/workspace-library.type';

/**
 * The fields of the `package.json` of a library left out of its package: they serve its development only.
 */
const DEVELOPMENT_FIELDS: ReadonlySet<string> = new Set(['scripts', 'devDependencies']);

/**
 * The extensions a module referenced by a type of a binding of a library may have, without them in the type.
 */
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/**
 * Writes the manifest of a library (see `LibraryManifest`): what its package exports, by path, and the components and
 * directives it exports, the types of their bindings referencing the modules of the library relative to the root of the
 * package, as the applications read them through its declarations.
 *
 * @param packageJson - The `package.json` of the library.
 * @param analysis - What the build reads of the sources of the library (see `analyzeLibrary`).
 * @param program - The program of the library.
 * @param library - The library.
 * @param xaendarVersion - The version of Xaendar compiling the library.
 * @returns The manifest.
 * @throws If a type of a binding reads a name from a file outside of the library, or from a module of the library that
 *   does not export it, since the declarations of the package would not hold it.
 */
export function createLibraryManifest(packageJson: LibraryPackageJson, analysis: LibraryAnalysis, program: Program, library: WorkspaceLibrary, xaendarVersion: string): LibraryManifest {
  const errors = new Array<string>();
  const declarations: Record<string, LibraryManifestDeclaration> = {};
  for (const [key, metadata] of analysis.declarations) {
    checkTypeReferences(key, metadata, program, analysis.base, errors);
    const name = key.slice(0, key.indexOf('#'));
    declarations[key] = toLibraryDeclaration(metadata, `./${name}`, `./${name}.d.ts`, module => (module.startsWith(`${analysis.base}/`) ? `./${module.slice(analysis.base.length + 1)}` : module));
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  return {
    schemaVersion: 1,
    name: library.name,
    version: packageJson.version ?? '0.0.0',
    xaendar: xaendarVersion,
    ssr: library.ssr,
    exports: analysis.exports,
    declarations,
    selectors: analysis.selectors
  };
}

/**
 * Writes the `package.json` of the package of a library: the fields of the one of the library but the ones of its
 * development, an ES module whose `exports` lead its entry (`.`) and the module of each exported component and directive
 * to their JavaScript, with their declarations (`types`) and, when the library renders on the server, their code for the
 * server (`xaendar-server`); the modules defining a component or a directive, and the chunks they share, as side
 * effects; `@xaendar/core` among the peer dependencies at the version compiling it (and `@xaendar/ssr`, optional, for
 * the server), and its manifest.
 *
 * @param packageJson - The `package.json` of the library.
 * @param analysis - What the build reads of the sources of the library (see `analyzeLibrary`).
 * @param ssr - Whether the library renders on the server.
 * @param xaendarVersion - The version of Xaendar compiling the library.
 * @returns The content of the `package.json` of the package.
 */
export function createLibraryPackageJson(packageJson: LibraryPackageJson, analysis: LibraryAnalysis, ssr: boolean, xaendarVersion: string): LibraryPackageJson {
  const result: LibraryPackageJson = {};
  const fields = Object.keys(packageJson);
  for (let i = 0; i < fields.length; i++) {
    if (!DEVELOPMENT_FIELDS.has(fields[i])) {
      result[fields[i]] = packageJson[fields[i]];
    }
  }

  result.type = 'module';
  result.types = `./${analysis.entry}.d.ts`;
  result.exports = createExports(analysis, ssr);
  result.sideEffects = createSideEffects(analysis, ssr);
  const peerDependencies = Object.assign({}, packageJson.peerDependencies, { '@xaendar/core': `^${xaendarVersion}` });
  if (ssr) {
    peerDependencies['@xaendar/ssr'] = `^${xaendarVersion}`;
    result.peerDependenciesMeta = Object.assign({}, packageJson.peerDependenciesMeta, { '@xaendar/ssr': { optional: true } });
  }

  result.peerDependencies = peerDependencies;
  result.xaendar = { manifest: './xaendar-manifest.json' };
  return result;
}

/**
 * Checks the names the types of the bindings of a component or of a directive read from the files of the library: each
 * one must be exported by its module, as the applications read it through the declarations of the package, and no type
 * can read a file outside of the library.
 *
 * @param key - The key of the declaration of the component or of the directive.
 * @param metadata - Its metadata.
 * @param program - The program of the library.
 * @param base - The folder of the entry of the library.
 * @param errors - The errors, filled.
 */
function checkTypeReferences(key: string, metadata: ComponentOrDirectiveMetadata, program: Program, base: string, errors: string[]): void {
  const types = new Array<string>();
  for (const property of metadata.properties.values()) {
    types.push(property.type);
  }

  for (const event of metadata.events.values()) {
    types.push(event.type);
  }

  for (let i = 0; i < types.length; i++) {
    const references = listTypeReferences(types[i]);
    if (references?.length) {
      for (let j = 0; j < references.length; j++) {
        const { module, name } = references[j];
        if (module.startsWith(`${base}/`) ? !isExportedBy(program, module, name) : isFilePath(module)) {
          errors.push(`${key}: the type of one of its bindings reads ${name} from ${module}, which a module of the library must export for the applications to read it.`);
        }
      }
    }
  }
}

/**
 * Tells whether a module of a library exports a name.
 *
 * @param program - The program of the library.
 * @param module - The path of the module, without extension.
 * @param name - The name.
 * @returns `true` when it does.
 */
function isExportedBy(program: Program, module: string, name: string): boolean {
  const sourceFile = SOURCE_EXTENSIONS.map(extension => program.getSourceFile(`${module}${extension}`)).find(file => file !== undefined);
  const checker = program.getTypeChecker();
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  return !!moduleSymbol && checker.getExportsOfModule(moduleSymbol).some(symbol => symbol.name === name);
}

/**
 * Tells whether a module a type references is a file, by its absolute path, rather than a package.
 *
 * @param module - The module.
 * @returns `true` for an absolute path.
 */
function isFilePath(module: string): boolean {
  return posix.isAbsolute(module) || /^[A-Za-z]:\//.test(module);
}

/**
 * Writes the `exports` of the package of a library.
 *
 * @param analysis - What the build reads of the sources of the library.
 * @param ssr - Whether the library renders on the server.
 * @returns The `exports`.
 */
function createExports(analysis: LibraryAnalysis, ssr: boolean): Record<string, unknown> {
  const exports: Record<string, unknown> = { '.': toConditions(analysis.entry, ssr) };
  const paths = Object.keys(analysis.exports);
  for (let i = 0; i < paths.length; i++) {
    if (paths[i] !== '.') {
      exports[paths[i]] = toConditions(paths[i].slice(2), ssr);
    }
  }

  exports['./package.json'] = './package.json';
  exports['./xaendar-manifest.json'] = './xaendar-manifest.json';
  return exports;
}

/**
 * Writes the conditions of a path of the `exports` of the package of a library: the declarations first, then the code
 * of the server, then the one of the browser.
 *
 * @param name - The name of the module in the build.
 * @param ssr - Whether the library renders on the server.
 * @returns The conditions.
 */
function toConditions(name: string, ssr: boolean): Record<string, string> {
  const conditions: Record<string, string> = { types: `./${name}.d.ts` };
  if (ssr) {
    conditions['xaendar-server'] = `./server/${name}.js`;
  }

  conditions.default = `./${name}.js`;
  return conditions;
}

/**
 * Lists the files of the package of a library that have side effects: the modules defining a component or a directive
 * when they are evaluated, and the chunks they share.
 *
 * @param analysis - What the build reads of the sources of the library.
 * @param ssr - Whether the library renders on the server.
 * @returns The files, relative to the root of the package.
 */
function createSideEffects(analysis: LibraryAnalysis, ssr: boolean): string[] {
  const files = new Array<string>();
  for (const name of analysis.modules.values()) {
    files.push(`./${name}.js`);
    if (ssr) {
      files.push(`./server/${name}.js`);
    }
  }

  files.push('./chunks/*.js');
  if (ssr) {
    files.push('./server/chunks/*.js');
  }

  return files;
}
