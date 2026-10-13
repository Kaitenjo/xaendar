import { type CompilerCache, type ComponentOrDirectiveMetadata, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile } from '@xaendar/compiler';
import { type CompilerOptions, createSourceFile, ScriptTarget } from 'typescript';
import { readDocument } from '../language-service/language-service';
import { resolveModulePath } from '../utils/module-path/module-path.utils';
import { normalizeFileName, resolvePosixPath } from '../utils/path/path.utils';

/**
 * The metadata extracted from a file, together with the text they were extracted from.
 */
type MetadataEntry = {
  /**
   * The text of the file the metadata were extracted from.
   */
  readonly text: string;
  /**
   * The metadata of the components and directives declared in the file, keyed by class name.
   */
  readonly metadatas: ReadonlyMap<string, ComponentOrDirectiveMetadata>;
};

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

    const fileName = Array.isArray(path) ? resolveModulePath(path[0], path[1]) : path && resolvePosixPath(path);
    const metadata = fileName && (await this._getFileMetadatas(fileName))?.get(name);
    if (!metadata) {
      throw new Error(`Class "${name}" was not found in the import from ${Array.isArray(path) ? path[1] : path}`);
    }

    return metadata;
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
    this._entries.delete(normalizeFileName(fileName));
  }

  /**
   * Discards every metadata.
   */
  public clear(): void {
    this._entries.clear();
    this._selectors.clear();
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
    const metadatas = new Map<string, ComponentOrDirectiveMetadata>([
      ...(await extractComponentsMetadataFromSourceFile(sourceFile, this._compilerOptions) ?? []),
      ...(await extractDirectivesMetadataFromSourceFile(sourceFile, this._compilerOptions) ?? [])
    ]);
    this._entries.set(key, { text, metadatas });
    return metadatas;
  }
}
