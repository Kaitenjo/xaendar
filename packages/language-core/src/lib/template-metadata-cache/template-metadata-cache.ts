import { type CompilerCache, type ComponentOrDirectiveMetadata, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile, type ImportedSymbol, isReactiveExport } from '@xaendar/compiler';
import { type CompilerOptions, createSourceFile, ScriptTarget } from 'typescript';
import { readDocument } from '../language-service/language-service';
import { NOT_IMPORTABLE } from '../utils/module-entries/module-entries.utils';
import { resolveModule, resolveModulePath } from '../utils/module-path/module-path.utils';
import { normalizeFileName, resolvePosixPath } from '../utils/path/path.utils';
import type { MetadataEntry } from '../types/metadata-entry.type';

/**
 * What a file declaring a component or a directive contains: the decorator, whose presence tells it from the files that
 * can be skipped without parsing them.
 */
const DECLARATION_DECORATOR = /@(?:WebComponent|Directive)\s*\(/;

/**
 * Cache of the metadata of the components and directives imported by the templates open in an editor:
 * the implementation of the `CompilerCache` the compiler resolves the `@import`s of a template through.
 *
 * The metadata of a file are extracted again whenever its text changes, the unsaved one of an open document
 * included (see `readDocument`), or when the file is invalidated explicitly.
 */
export class TemplateMetadataCache implements CompilerCache {
  /**
   * The metadata extracted from each file, keyed by its normalized path.
   */
  private readonly _entries = new Map<string, MetadataEntry>();
  /**
   * The metadata stored by selector (see `set`).
   */
  private readonly _selectors = new Map<string, ComponentOrDirectiveMetadata>();
  /**
   * The normalized paths of the files known to declare no component or directive, so that they are not read again.
   */
  private readonly _withoutDeclarations = new Set<string>();

  /**
   * Creates a cache.
   *
   * @param _compilerOptions - The options of the project, driving how the modules declaring the base classes are resolved.
   */
  constructor(private readonly _compilerOptions?: CompilerOptions) { }

  /**
   * Returns the metadata of a component or directive imported by a template, extracting them from the file declaring it.
   *
   * @param name - The class name of the component or directive, or a selector stored through `set`.
   * @param path - The directory of the template and the path of the `@import`, or the path of the file declaring the class.
   * @returns The metadata of the class.
   * @throws If the module cannot be resolved or doesn't declare a component or directive with that name.
   */
  public async getOrInsert(name: string, path?: string | string[]): Promise<ComponentOrDirectiveMetadata> {
    const stored = this._selectors.get(name);
    if (!path && stored) {
      return stored;
    }

    const fileName = Array.isArray(path) ? resolveModulePath(path[0], path[1], this._compilerOptions) : path && resolvePosixPath(path);
    const metadata = fileName && (await this._getFileMetadatas(fileName))?.get(name);
    if (!metadata) {
      throw new Error(`Class "${name}" was not found in the import from ${Array.isArray(path) ? path[1] : path}`);
    }

    return metadata;
  }

  /**
   * Resolves what an `@import` specifier of a template imports: the metadata of the component or of the directive it
   * names, or any other export of the module, reactive when reading it can read a signal (a namespace always is), as
   * the build tells it: the type-check reads it to tell whether a `@let` is a signal.
   * A symbol of a package keeps the path written in the `@import`, which the type-check code imports it with.
   *
   * @param imported - The name of the export (`'default'` for the default one, `'*'` for a namespace import).
   * @param local - The name the template imports it as, which names a component or a directive exported as default.
   * @param baseDir - The directory of the template.
   * @param path - The path of the module, as written in the `@import`.
   * @returns The metadata of the component or of the directive, or the imported symbol.
   * @throws If the module cannot be resolved or read.
   */
  public async getImport(imported: string, local: string, baseDir: string, path: string): Promise<ComponentOrDirectiveMetadata | ImportedSymbol> {
    const resolved = resolveModule(baseDir, path, this._compilerOptions);
    const metadatas = resolved && await this._getFileMetadatas(resolved.fileName);
    if (!resolved || !metadatas) {
      throw new Error(`Cannot find module "${path}"`);
    }

    const metadata = imported !== '*' && metadatas.get(imported === 'default' ? local : imported);
    if (metadata) {
      return metadata;
    }

    const symbol: ImportedSymbol = { type: 'symbol', modulePath: resolved.fileName, reactive: imported === '*' || isReactiveExport(resolved.fileName, imported, this._compilerOptions) };
    if (resolved.external) {
      symbol.importPath = path;
    }

    return symbol;
  }

  /**
   * Returns the metadata of every component and directive declared in a module, extracting them from its file.
   *
   * @param baseDir - The directory the path of the module is relative to.
   * @param modulePath - The path of the module, as written in the `@import`.
   * @returns The metadata, keyed by class name; `undefined` if the module cannot be resolved or read.
   */
  public async getModuleMetadatas(baseDir: string, modulePath: string): Promise<ReadonlyMap<string, ComponentOrDirectiveMetadata> | undefined> {
    const fileName = resolveModulePath(baseDir, modulePath, this._compilerOptions);
    if (fileName) {
      return this._getFileMetadatas(fileName);
    }
  }

  /**
   * Returns the metadata of the components and directives declared in some files, extracting them from the ones
   * that were not read yet: the files that are not modules to import (declarations, specs and tests), those that
   * cannot be read and those whose metadata cannot be extracted (e.g. properties that clash) are skipped.
   *
   * @param fileNames - The paths of the files.
   * @returns The metadata of each file declaring some, keyed by class name, `undefined` if none does.
   */
  public async getDeclarations(fileNames: readonly string[]): Promise<Map<string, ReadonlyMap<string, ComponentOrDirectiveMetadata>> | undefined> {
    let declarations: Map<string, ReadonlyMap<string, ComponentOrDirectiveMetadata>> | undefined;
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const key = normalizeFileName(fileName);
      if (NOT_IMPORTABLE.test(fileName) || this._withoutDeclarations.has(key)) {
        continue;
      }

      const text = readDocument(fileName);
      if (text === undefined || !DECLARATION_DECORATOR.test(text)) {
        this._withoutDeclarations.add(key);
        continue;
      }

      try {
        const metadatas = await this._getFileMetadatas(fileName);
        if (metadatas?.size) {
          declarations ??= new Map();
          declarations.set(fileName, metadatas);
        }
      } catch {
        // The metadata of a file whose properties clash cannot be extracted: it has nothing to propose
      }
    }

    return declarations;
  }

  /**
   * Stores the metadata of a component or directive by its selector.
   *
   * @param selector - The selector.
   * @param value - The metadata.
   */
  public set(selector: string, value: ComponentOrDirectiveMetadata): void {
    this._selectors.set(selector, value);
  }

  /**
   * Discards the metadata extracted from a file, e.g. when it changes on disk.
   *
   * @param fileName - The path of the file.
   */
  public invalidate(fileName: string): void {
    const key = normalizeFileName(fileName);
    this._entries.delete(key);
    this._withoutDeclarations.delete(key);
  }

  /**
   * Discards every metadata.
   */
  public clear(): void {
    this._entries.clear();
    this._selectors.clear();
    this._withoutDeclarations.clear();
  }

  /**
   * Returns the metadata of the components and directives declared in a file, extracting them again when its text changed.
   *
   * @param fileName - The path of the file.
   * @returns The metadata, keyed by class name, or `undefined` if the file cannot be read.
   */
  private async _getFileMetadatas(fileName: string): Promise<ReadonlyMap<string, ComponentOrDirectiveMetadata> | undefined> {
    const text = readDocument(fileName);
    if (text === undefined) {
      return undefined;
    }

    const key = normalizeFileName(fileName);
    const cached = this._entries.get(key);
    if (cached?.text === text) {
      return cached.metadatas;
    }

    const sourceFile = createSourceFile(fileName, text, ScriptTarget.Latest, true);
    const components = await extractComponentsMetadataFromSourceFile(sourceFile, this._compilerOptions);
    const metadatas = new Map<string, ComponentOrDirectiveMetadata>(components);
    const directives = await extractDirectivesMetadataFromSourceFile(sourceFile, this._compilerOptions);
    if (directives?.size) {
      for (const [className, directive] of directives) {
        metadatas.set(className, directive);
      }
    }

    this._entries.set(key, { text, metadatas });
    return metadatas;
  }
}
