import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import type { LibraryComponentMetadata } from '../../types/library-component-metadata.type';
import type { LibraryDirectiveMetadata } from '../../types/library-directive-metadata.type';
import { findForbiddenNameChar } from '../../lexer/utils/chars/chars.utils';
import type { LibraryManifestDeclaration } from '../../types/library-manifest/library-manifest-declaration.type';
import type { LibraryManifest } from '../../types/library-manifest/library-manifest.type';
import type { PackageJson } from '../../types/package-json.type';
import type { PackageLibrary } from '../../types/package-library.type';
import { toLibraryMetadata } from '../library-manifest/library-manifest.utils';

/**
 * The format of the manifests this version of Xaendar reads.
 */
const SCHEMA_VERSION: number = 1;

/**
 * A name of JavaScript a class or a property of a manifest has: the name of a class, or of the accessor of an input.
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Matches the name of a part a component exposes: no whitespace, comma nor colon, which `exportparts` could not
 * forward.
 */
const PART_NAME = /^[^\s,:]+$/;

/**
 * The declaration files, the only modules of a compiled library a template imports its components and directives from.
 */
const DECLARATION_FILE = /\.d\.[cm]?ts$/;

/**
 * The packages read, by their root, with the time their `package.json` was modified at: a package is read again once
 * it is installed again, and once `xd build` writes a library of the workspace again.
 */
const packages = new Map<string, { readonly mtime: number, readonly library: PackageLibrary | undefined }>();

/**
 * Reads the component or the directive a declaration file of a compiled library exports under a name: the `exports` of
 * the package lead the file to one of its paths (`.`, `./card/card.xd.component`), and the manifest of the package
 * tells what that path exports.
 *
 * @param declarationFile - The absolute path of the declaration file, as the path of an `@import` resolves.
 * @param exportedName - The name of the export, `'default'` for the default one.
 * @returns The metadata, `undefined` when the file is not of a compiled library, or exports no component nor directive
 *   under that name.
 * @throws If the manifest of the package cannot be read (see {@link readLibrary}).
 */
export function readLibraryMetadata(declarationFile: string, exportedName: string): LibraryComponentMetadata | LibraryDirectiveMetadata | undefined {
  if (!DECLARATION_FILE.test(declarationFile)) {
    return undefined;
  }

  const library = findLibrary(declarationFile);
  const subpath = library?.subpaths.get(normalizeFileName(declarationFile));
  // Own properties only: a name of `Object.prototype` (`toString`) is no export
  const exported = library && subpath !== undefined && Object.hasOwn(library.manifest.exports, subpath) ? library.manifest.exports[subpath] : undefined;
  return exported && Object.hasOwn(exported, exportedName) ? getLibraryMetadata(library!, exported[exportedName]) : undefined;
}

/**
 * Reads a component or a directive of a compiled library from the declaration file declaring its class, as the
 * `hostDirectives` of a component lead to the class of a directive.
 *
 * @param declarationFile - The absolute path of the declaration file declaring the class.
 * @param className - The name of the class.
 * @returns The metadata, `undefined` when the file is not of a compiled library, or declares no component nor directive
 *   with that name.
 * @throws If the manifest of the package cannot be read (see {@link readLibrary}).
 */
export function readLibraryClass(declarationFile: string, className: string): LibraryComponentMetadata | LibraryDirectiveMetadata | undefined {
  const library = DECLARATION_FILE.test(declarationFile) ? findLibrary(declarationFile) : undefined;
  if (!library) {
    return undefined;
  }

  const types = `./${posix.relative(library.root, toPosixPath(declarationFile))}`;
  const { declarations } = library.manifest;
  const key = Object.keys(declarations).find(candidate => declarations[candidate].types === types && declarations[candidate].className === className);
  return key === undefined ? undefined : getLibraryMetadata(library, key);
}

/**
 * Finds the compiled library a file belongs to: the package of the nearest `package.json` above the file, when it points
 * to a manifest.
 *
 * @param fileName - The absolute path of the file.
 * @returns The library, `undefined` when the file belongs to no package, or to one that is not a compiled library.
 * @throws If the manifest of the package cannot be read (see {@link readLibrary}).
 */
export function findLibrary(fileName: string): PackageLibrary | undefined {
  const root = findPackageRoot(dirname(fileName));
  return root === undefined ? undefined : readLibrary(root);
}

/**
 * Reads the compiled library at the root of a package (see `xd build`): the `xaendar.manifest` of its `package.json`
 * leads to its manifest. A library is read once, and again when its `package.json` changes.
 *
 * @param root - The absolute path of the root of the package, with forward slashes.
 * @returns The library, `undefined` when the package is not a compiled library.
 * @throws If the manifest cannot be read or has a format this version of Xaendar does not read, or if the code of the
 *   library needs a later version of the `@xaendar/core` it imports: the same major version as the one compiling it,
 *   not an older one.
 */
export function readLibrary(root: string): PackageLibrary | undefined {
  const mtime = statSync(`${root}/package.json`).mtimeMs;
  const cached = packages.get(root);
  if (cached?.mtime === mtime) {
    return cached.library;
  }

  const library = loadLibrary(root, readPackageJson(root));
  packages.set(root, { mtime, library });
  return library;
}

/**
 * Finds the compiled libraries a project depends on, and the ones they depend on in turn, reading the `package.json` of
 * each dependency from the `node_modules` folders Node reads it from.
 *
 * @param projectDir - The folder of the project, holding its `package.json`.
 * @returns The libraries, `undefined` when the project depends on none.
 * @throws If the manifest of a library cannot be read (see {@link readLibrary}).
 */
export function findPackageLibraries(projectDir: string): PackageLibrary[] | undefined {
  const root = toPosixPath(projectDir);
  if (!existsSync(`${root}/package.json`)) {
    return undefined;
  }

  const libraries = new Array<PackageLibrary>();
  collectLibraries(root, readDependencyNames(readPackageJson(root), true), new Set(), libraries);
  return libraries.length ? libraries : undefined;
}

/**
 * Collects the compiled libraries among some dependencies of a package, and among the dependencies of those libraries.
 *
 * @param dir - The folder of the package depending on them, which their `node_modules` folders are found from.
 * @param names - The names of the dependencies.
 * @param visited - The roots of the packages already read.
 * @param libraries - The libraries, filled.
 * @throws If the manifest of a library cannot be read (see {@link readLibrary}).
 */
function collectLibraries(dir: string, names: readonly string[], visited: Set<string>, libraries: PackageLibrary[]): void {
  for (let i = 0; i < names.length; i++) {
    const root = findDependencyRoot(dir, names[i]);
    if (root !== undefined && !visited.has(root)) {
      visited.add(root);
      const library = readLibrary(root);
      if (library) {
        libraries.push(library);
        collectLibraries(root, readDependencyNames(library.packageJson, false), visited, libraries);
      }
    }
  }
}

/**
 * Reads the names of the dependencies of a package: the ones it runs with, and, for the project, the ones it is
 * developed with too.
 *
 * @param packageJson - The `package.json` of the package.
 * @param development - Whether the dependencies of the development count.
 * @returns The names.
 */
function readDependencyNames(packageJson: PackageJson, development: boolean): string[] {
  const groups = [packageJson.dependencies, packageJson.peerDependencies, packageJson.optionalDependencies];
  if (development) {
    groups.push(packageJson.devDependencies);
  }

  const names = new Array<string>();
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group) {
      const keys = Object.keys(group);
      for (let j = 0; j < keys.length; j++) {
        names.push(keys[j]);
      }
    }
  }

  return names;
}

/**
 * Reads the compiled library described by the `package.json` of a package.
 *
 * @param root - The absolute path of the root of the package.
 * @param packageJson - The `package.json` of the package.
 * @returns The library, `undefined` when the `package.json` points to no manifest.
 * @throws If the manifest cannot be read, or the library cannot run with the `@xaendar/core` it imports.
 */
function loadLibrary(root: string, packageJson: PackageJson): PackageLibrary | undefined {
  const manifestPath = packageJson.xaendar?.manifest;
  if (manifestPath === undefined) {
    return undefined;
  }

  if (!isPackagePath(manifestPath)) {
    throw new Error(`The manifest of ${packageJson.name}, ${manifestPath}, is not a file of the package: write xaendar.manifest of its package.json as a path inside it, e.g. ./xaendar-manifest.json`);
  }

  const path = posix.join(root, manifestPath);
  let manifest: LibraryManifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    throw new Error(`Cannot read the manifest of ${packageJson.name}, ${path}: ${error}`, { cause: error });
  }

  checkManifest(manifest, root);
  const invalid = findInvalidDeclaration(manifest, packageJson);
  if (invalid !== undefined) {
    throw new Error(`The manifest of ${packageJson.name}, ${path}, is not one Xaendar writes: ${invalid}. Build the library again with xd build.`);
  }

  return { root, packageJson, manifest, subpaths: readSubpaths(packageJson, root), metadatas: new Map() };
}

/**
 * Finds what a manifest holds that Xaendar never writes in one: the code generated for the templates of an application
 * writes the names of its components, directives, inputs and events as they are (`name: 'label'`), so a manifest is
 * read only when they are names a template or a class declares, and its paths only when they are inside the package.
 *
 * N.B. A manifest comes from a package of `node_modules`, not from the project: a name holding a quote would write code
 * into the application (`"property": "x'+alert(1)+'"`), and a path out of the package would read another one. Do not
 * read a manifest without this check.
 *
 * @param manifest - The manifest.
 * @param packageJson - The `package.json` of its package.
 * @returns What is wrong, `undefined` when nothing is.
 */
function findInvalidDeclaration({ name, exports, declarations }: LibraryManifest, packageJson: PackageJson): string | undefined {
  if (name !== packageJson.name) {
    return `it names the package ${name}`;
  }

  const keys = Object.keys(declarations);
  for (let i = 0; i < keys.length; i++) {
    const invalid = findInvalidMembers(declarations[keys[i]]);
    if (invalid !== undefined) {
      return `${keys[i]} ${invalid}`;
    }
  }

  const subpaths = Object.keys(exports);
  for (let i = 0; i < subpaths.length; i++) {
    const exported = exports[subpaths[i]];
    const names = Object.keys(exported);
    for (let j = 0; j < names.length; j++) {
      if (!Object.hasOwn(declarations, exported[names[j]])) {
        return `the export ${names[j]} of ${subpaths[i]} has no declaration`;
      }
    }
  }

  return undefined;
}

/**
 * Finds what a declaration of a manifest holds that Xaendar never writes in one (see {@link findInvalidDeclaration}).
 *
 * @param declaration - The declaration.
 * @returns What is wrong, `undefined` when nothing is.
 */
function findInvalidMembers({ className, selector, module, types, inputs, events, parts }: LibraryManifestDeclaration): string | undefined {
  if (!IDENTIFIER.test(className)) {
    return `has the class name ${className}`;
  }

  if (!isName(selector)) {
    return `has the selector ${selector}`;
  }

  if (module !== '.' && !isPackagePath(module)) {
    return `has the module ${module}, not a path of the exports of the package`;
  }

  if (!isPackagePath(types)) {
    return `has the declarations ${types}, not a file of the package`;
  }

  for (let i = 0; i < inputs.length; i++) {
    const { name, property, attribute } = inputs[i];
    if (!isName(name) || (property !== undefined && !IDENTIFIER.test(property))) {
      return `has the input ${property ?? name}`;
    }

    if (attribute !== undefined && (typeof attribute !== 'string' || !isName(attribute))) {
      return `has the input ${property ?? name} written by the attribute ${String(attribute)}`;
    }
  }

  for (let i = 0; i < events.length; i++) {
    if (!isName(events[i].name)) {
      return `has the event ${events[i].name}`;
    }
  }

  if (parts !== undefined && (!Array.isArray(parts.names) || (parts.open !== undefined && parts.open !== true))) {
    return 'has parts that are not a list of names';
  }

  const invalidPart = parts?.names.find(name => typeof name !== 'string' || !PART_NAME.test(name));
  if (invalidPart !== undefined) {
    return `has the part ${String(invalidPart)}`;
  }

  return undefined;
}

/**
 * Tells whether a name of a manifest is one a template can write: a selector, an input or an event.
 *
 * @param name - The name.
 * @returns `true` for a text holding no character a name of a template cannot hold (`isForbiddenNameChar`).
 */
function isName(name: string): boolean {
  return name !== '' && findForbiddenNameChar(name) === -1;
}

/**
 * Tells whether a path of a manifest or of the `package.json` of a library leads to a file of its package: relative to
 * its root, `./` first, and never into a folder above.
 *
 * @param path - The path.
 * @returns `true` for a path inside the package.
 */
function isPackagePath(path: string): boolean {
  return typeof path === 'string' && path.startsWith('./') && !path.split(/[/\\]/).includes('..');
}

/**
 * Checks that a manifest has the format this version of Xaendar reads, and that the `@xaendar/core` the code of its
 * library imports, when it is found, can run it: the same major version as the one compiling the library, not an older
 * one, since the code calls the internal helpers of that version.
 *
 * @param manifest - The manifest.
 * @param root - The absolute path of the root of the package.
 * @throws If the manifest has another format, or the version of `@xaendar/core` cannot run the library.
 */
function checkManifest({ schemaVersion, name, version, xaendar }: LibraryManifest, root: string): void {
  if (schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`The manifest of ${name} ${version} has the format ${schemaVersion}, which this version of Xaendar does not read: update the Xaendar packages of the project.`);
  }

  const coreRoot = findDependencyRoot(root, '@xaendar/core');
  const core = coreRoot === undefined ? undefined : readPackageJson(coreRoot).version;
  if (core !== undefined && !isCompatibleVersion(core, xaendar)) {
    throw new Error(`${name} ${version} was compiled by Xaendar ${xaendar}, and needs @xaendar/core ${xaendar} or a later ${parseVersion(xaendar)[0]}.x version: the project has ${core}.`);
  }
}

/**
 * Tells whether a version of `@xaendar/core` runs the code compiled by another version of Xaendar: the same major
 * version, not an older one.
 *
 * @param installed - The version of `@xaendar/core`.
 * @param required - The version of Xaendar compiling the code.
 * @returns `true` when it does.
 */
function isCompatibleVersion(installed: string, required: string): boolean {
  const [major, minor, patch] = parseVersion(installed);
  const [requiredMajor, requiredMinor, requiredPatch] = parseVersion(required);
  return major === requiredMajor && (minor > requiredMinor || (minor === requiredMinor && patch >= requiredPatch));
}

/**
 * Reads the numbers of a version (`1.4.2-rc.1` → `[1, 4, 2]`).
 *
 * @param version - The version.
 * @returns Its major, minor and patch numbers.
 */
function parseVersion(version: string): number[] {
  return version.split(/[-+]/)[0].split('.').map(Number);
}

/**
 * Reads the paths of the `exports` of a package, keyed by the declaration file each one leads TypeScript to (its
 * `types`).
 *
 * @param packageJson - The `package.json` of the package.
 * @param root - The absolute path of the root of the package.
 * @returns The paths, keyed by the normalized path of their declaration file.
 */
function readSubpaths({ exports }: PackageJson, root: string): Map<string, string> {
  const subpaths = new Map<string, string>();
  if (exports) {
    const paths = Object.keys(exports);
    for (let i = 0; i < paths.length; i++) {
      const conditions = exports[paths[i]];
      if (typeof conditions === 'object' && conditions !== null && 'types' in conditions && typeof conditions.types === 'string') {
        subpaths.set(normalizeFileName(posix.join(root, conditions.types)), paths[i]);
      }
    }
  }

  return subpaths;
}

/**
 * Returns the metadata of a component or of a directive of a library, read from its manifest the first time.
 *
 * @param library - The library.
 * @param key - The key of its declaration in the manifest.
 * @returns The metadata.
 */
function getLibraryMetadata(library: PackageLibrary, key: string): LibraryComponentMetadata | LibraryDirectiveMetadata {
  let metadata = library.metadatas.get(key);
  if (!metadata) {
    metadata = toLibraryMetadata(library.manifest.declarations[key], library.manifest, library.root);
    library.metadatas.set(key, metadata);
  }

  return metadata;
}

/**
 * Finds the root of the package a folder belongs to: the nearest folder holding a `package.json`, the folder itself
 * included.
 *
 * @param dir - The absolute path of the folder.
 * @returns The root, with forward slashes, `undefined` when no folder above holds a `package.json`.
 */
function findPackageRoot(dir: string): string | undefined {
  let current = dir;
  while (!existsSync(`${current}/package.json`)) {
    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }

  return toPosixPath(current);
}

/**
 * Finds the root of the package a package imports by a name, as Node finds it: in the `node_modules` folder of its own
 * folder or of the nearest one above holding it. A linked package is found at its real path, the one TypeScript
 * resolves its files to.
 *
 * @param dir - The absolute path of the folder of the package importing it.
 * @param name - The name of the package.
 * @returns The root, with forward slashes, `undefined` when it is not installed.
 */
function findDependencyRoot(dir: string, name: string): string | undefined {
  let current = dir;
  while (!existsSync(`${current}/node_modules/${name}/package.json`)) {
    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }

  return toPosixPath(realpathSync(`${current}/node_modules/${name}`));
}

/**
 * Reads the `package.json` of a package.
 *
 * @param root - The absolute path of the root of the package.
 * @returns Its content.
 */
function readPackageJson(root: string): PackageJson {
  return JSON.parse(readFileSync(`${root}/package.json`, 'utf-8'));
}

/**
 * Writes a path with forward slashes, as TypeScript names the files.
 *
 * @param path - The path.
 * @returns The path, with forward slashes.
 */
function toPosixPath(path: string): string {
  return path.replaceAll('\\', '/');
}

/**
 * Normalizes a path to compare it with another one written in another way: with forward slashes and a lowercase drive
 * letter, as the paths of a file may differ in both on Windows.
 *
 * N.B. The first character is lowered whatever it is: the paths compared are absolute, so it is the drive letter on
 * Windows and `/` elsewhere, which stays as it is. Lowering only a drive letter would need a branch (or a callback of
 * `replace`) that runs on Windows only, and the coverage, enforced at 100%, would fail on the other systems, the Linux
 * runners of the CI included. Do not replace it with a test of the drive letter.
 *
 * @param fileName - The absolute path.
 * @returns The normalized path.
 */
function normalizeFileName(fileName: string): string {
  const path = toPosixPath(fileName);
  return `${path.charAt(0).toLowerCase()}${path.slice(1)}`;
}
