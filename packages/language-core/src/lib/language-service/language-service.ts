import { statSync } from 'node:fs';
import { CompilerOptions, createDocumentRegistry, createLanguageService, getDefaultLibFilePath, LanguageService, LanguageServiceHost, ScriptSnapshot, sys } from 'typescript';
import type { VirtualFileEntry } from '../types/virtual-file-entry.type';
import { normalizeFileName } from '../utils/path/path.utils';

/**
 * language-service.ts
 *
 * Manages, for every TypeScript project (one per `tsconfig.json`), a
 * `ProjectLanguageService` holding:
 * - a map of "virtual files" (the TS shims generated from the DSL AST),
 *   each versioned so the LanguageService can tell when to re-check them
 * - a persistent ts.LanguageService that sees both the real files on disk
 *   and the virtual shim files
 * - dispose/reinitialization when compilerOptions change mid-session
 * - cleanup helpers for virtual files whose source DSL file has disappeared
 *
 * The functions exported at module level work on the default instance, shared by
 * the build tools (the Vite plugin's `transform` hook and anywhere else in the
 * pipeline that needs to query diagnostics). An editor, which may open files of
 * several projects at once, gets one instance per `tsconfig.json` through
 * `getProjectLanguageService`, so that the projects don't recreate each other's LanguageService.
 *
 * The documents open in an editor are shared by every instance (see `setDocumentOverlay`):
 * their unsaved text is read in place of the file on disk.
 */

/**
 * The unsaved text of the documents open in an editor, keyed by their normalized path (see `normalizeFileName`).
 */
const documentOverlays = new Map<string, VirtualFileEntry>();

/**
 * The instances created for the TypeScript projects, keyed by the normalized path of their `tsconfig.json`.
 */
const projectLanguageServices = new Map<string, ProjectLanguageService>();

/**
 * The LanguageService of a TypeScript project, together with the virtual files and the real files it sees.
 */
export class ProjectLanguageService {
  /**
   * Generated TS shims, keyed by the absolute path of the virtual file.
   */
  private readonly _virtualFiles = new Map<string, VirtualFileEntry>();
  /**
   * Synthetic versions for real files, used to invalidate the LanguageService's
   * internal snapshot cache when a source file changes on disk (mtime-based).
   */
  private readonly _realFileVersions = new Map<string, string>();
  /**
   * Whether each real file exists, by its normalized path, as read while the real files are cached (see
   * {@link cacheRealFiles}).
   */
  private readonly _realFileExistence = new Map<string, boolean>();
  /**
   * Whether each directory exists, by its normalized path, as read while the real files are cached (see
   * {@link cacheRealFiles}).
   */
  private readonly _directoryExistence = new Map<string, boolean>();
  /**
   * Whether the versions and the existence of the real files and of the directories are read from the disk once, then
   * kept until a change of the file is reported (see {@link cacheRealFiles}, {@link invalidateRealFile}).
   */
  private _cachesRealFiles = false;
  /**
   * Real project files known to the Program, populated as the components are
   * processed (see `registerRealFile`).
   */
  private readonly _realFiles = new Set<string>();
  /**
   * Project files matched by the tsconfig's `files`/`include`/`exclude`, set on
   * every `getLanguageService()` call. They are part of the Program so that
   * ambient declarations not reachable through imports (e.g. a `globals.d.ts`
   * declaring the global `Signal` namespace) are visible to the shims.
   */
  private _projectFileNames: readonly string[] = [];
  /**
   * The LanguageService, lazily created on first use by `getLanguageService()` and torn down by `dispose()`.
   */
  private _languageService: LanguageService | undefined;
  /**
   * The compilerOptions the current LanguageService was created with, kept
   * around so `getLanguageService()` can detect when they change and force a
   * recreate (see the "vite.config / tsconfig changes mid-session" case).
   */
  private _compilerOptions: CompilerOptions | undefined;

  /**
   * Returns the LanguageService, creating it (or recreating it) as
   * needed. If the given compilerOptions differ from the ones the current
   * LanguageService was created with, the old instance is disposed and a
   * fresh one is created — this covers the case where vite.config / tsconfig
   * changes while the dev server is running.
   *
   * @param compilerOptions - The compilerOptions loaded from the project tsconfig.
   * @param fileNames - The project files loaded from the project tsconfig (see
   *   `loadTsConfig`). Changing them does not recreate the LanguageService: the
   *   host reads the root file names lazily.
   * @returns The LanguageService of the project.
   */
  public getLanguageService(compilerOptions: CompilerOptions, fileNames: readonly string[] = []): LanguageService {
    const optionsChanged = this._compilerOptions && JSON.stringify(this._compilerOptions) !== JSON.stringify(compilerOptions);

    if (this._languageService && optionsChanged) {
      this.dispose();
    }

    this._compilerOptions = compilerOptions;
    this._projectFileNames = fileNames;
    this._languageService ??= createLanguageService(this._createHost(), createDocumentRegistry());
    return this._languageService;
  }

  /**
   * Disposes the LanguageService and clears all associated state
   * (virtual files, real file version cache, known root files). Call this
   * when the server or the editor session closes, to avoid leaking a stale instance.
   */
  public dispose(): void {
    this._languageService?.dispose();
    this._languageService = undefined;
    this._compilerOptions = undefined;
    this._projectFileNames = [];
    this._virtualFiles.clear();
    this._realFileVersions.clear();
    this._realFileExistence.clear();
    this._directoryExistence.clear();
    this._realFiles.clear();
  }

  /**
   * Reads the versions and the existence of the real files and of the directories from the disk once, keeping them until
   * a change of a file is reported with {@link invalidateRealFile}: for a caller told of every change of the files it
   * depends on, as the build tools are by the watcher of Vite (nothing changes during a build). The files no watcher
   * reports, as the ones of `node_modules`, are read again only once the instance is disposed. The setting outlives
   * {@link dispose}.
   *
   * N.B. Deliberate, for speed: the LanguageService asks the version of every file of the Program at every request, once
   * per component in a build, and TypeScript probes the files and the directories of every module it resolves. Read from
   * the disk each time, they took millions of `stat` calls in the build of the site, a fifth of its time. Do not read
   * them again without a change reported.
   */
  public cacheRealFiles(): void {
    this._cachesRealFiles = true;
  }

  /**
   * Forgets what was read of a real file that changed on disk (see {@link cacheRealFiles}): its version and its existence
   * and, when it was created or deleted, the existence of every directory, which may have changed with it.
   *
   * @param fileName - The path of the file.
   * @param createdOrDeleted - Whether the file was created or deleted, rather than changed.
   */
  public invalidateRealFile(fileName: string, createdOrDeleted: boolean): void {
    const key = normalizeFileName(fileName);
    this._realFileVersions.delete(key);
    this._realFileExistence.delete(key);
    if (createdOrDeleted) {
      this._directoryExistence.clear();
    }
  }

  /**
   * Registers a real project file as a root file for the Program, so the
   * LanguageService's module resolver can find it when a virtual shim
   * imports the corresponding component class.
   *
   * @param fileName - The path of the file.
   */
  public registerRealFile(fileName: string): void {
    this._realFiles.add(fileName);
  }

  /**
   * Removes a real project file, e.g. when its source DSL file is deleted from
   * the project or no longer matches the plugin.
   *
   * @param fileName - The path of the file.
   */
  public removeRealFile(fileName: string): void {
    this._realFiles.delete(fileName);
  }

  /**
   * Updates (or creates) the virtual shim for the given path, bumping its
   * version only if the content actually changed — this avoids invalidating
   * the LanguageService's internal cache for no-op writes.
   *
   * @param virtualPath - The path of the shim.
   * @param content - The source of the shim.
   */
  public upsertVirtualFile(virtualPath: string, content: string): void {
    upsertEntry(this._virtualFiles, virtualPath, content);
  }

  /**
   * Removes a virtual shim, e.g. when its source DSL file is deleted from
   * the project or no longer matches the plugin.
   *
   * @param virtualPath - The path of the shim.
   */
  public removeVirtualFile(virtualPath: string): void {
    this._virtualFiles.delete(virtualPath);
  }

  /**
   * Builds a LanguageServiceHost backed by:
   * - the virtual files, for generated shims
   * - the documents open in an editor, for their unsaved text
   * - the real filesystem (via ts.sys), for actual project source files
   *
   * The root file names are read lazily, so the host always reflects the latest
   * project files and registered real files without needing to be rebuilt.
   *
   * @returns The host.
   */
  private _createHost(): LanguageServiceHost {
    return {
      getScriptFileNames: () => [
        ...new Set([...this._projectFileNames, ...this._realFiles]),
        ...this._virtualFiles.keys(),
      ],
      getScriptVersion: fileName => {
        const virtual = this._virtualFiles.get(fileName);
        const overlay = documentOverlays.get(normalizeFileName(fileName));
        return virtual ? String(virtual.version) : overlay ? `overlay-${overlay.version}` : this._getRealFileVersion(fileName);
      },
      getScriptSnapshot: fileName => {
        const text = this._readFile(fileName);
        return text === undefined ? undefined : ScriptSnapshot.fromString(text);
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => this._compilerOptions ?? {},
      getDefaultLibFileName: options => getDefaultLibFilePath(options),
      fileExists: fileName => this._virtualFiles.has(fileName) || documentOverlays.has(normalizeFileName(fileName)) || this._realFileExists(fileName),
      readFile: fileName => this._readFile(fileName),
      readDirectory: sys.readDirectory,
      directoryExists: directoryName => this._directoryExists(directoryName),
      getDirectories: sys.getDirectories,
      realpath: sys.realpath,
    };
  }

  /**
   * Reads a file: a virtual shim, the unsaved text of an open document, or the file on disk.
   *
   * @param fileName - The path of the file.
   * @returns Its text, or `undefined` if it doesn't exist or cannot be read.
   */
  private _readFile(fileName: string): string | undefined {
    const virtual = this._virtualFiles.get(fileName);
    if (virtual) {
      return virtual.content;
    }

    const overlay = documentOverlays.get(normalizeFileName(fileName));
    return overlay ? overlay.content : this._realFileExists(fileName) ? sys.readFile(fileName) : undefined;
  }

  /**
   * Tells whether a real file exists on disk, as read once while the real files are cached (see {@link cacheRealFiles}).
   *
   * @param fileName - The path of the file.
   * @returns `true` if the file exists.
   */
  private _realFileExists(fileName: string): boolean {
    return this._cachesRealFiles ? readOnce(this._realFileExistence, fileName, sys.fileExists) : sys.fileExists(fileName);
  }

  /**
   * Tells whether a directory exists on disk, as read once while the real files are cached (see {@link cacheRealFiles}).
   *
   * @param directoryName - The path of the directory.
   * @returns `true` if the directory exists.
   */
  private _directoryExists(directoryName: string): boolean {
    return this._cachesRealFiles ? readOnce(this._directoryExistence, directoryName, sys.directoryExists) : sys.directoryExists(directoryName);
  }

  /**
   * Synthetic version string for a real file, based on its mtime, so the
   * LanguageService can detect when a source file has changed on disk.
   * Falls back to the last known version (or '0') if the file can no longer
   * be stat'd, to avoid spurious invalidation churn. While the real files are cached (see {@link cacheRealFiles}), the
   * version read last is given until a change of the file is reported.
   *
   * @param fileName - The path of the file.
   * @returns The version of the file.
   */
  private _getRealFileVersion(fileName: string): string {
    const key = normalizeFileName(fileName);
    const known = this._realFileVersions.get(key);
    if (known !== undefined && this._cachesRealFiles) {
      return known;
    }

    try {
      const version = String(statSync(fileName).mtimeMs);
      this._realFileVersions.set(key, version);
      return version;
    } catch {
      return known ?? '0';
    }
  }
}

/**
 * The instance used by the functions exported at module level, i.e. by the build tools.
 */
const defaultProjectLanguageService = new ProjectLanguageService();

/**
 * Returns the instance of a TypeScript project, creating it on first use.
 *
 * @param configPath - The path of the `tsconfig.json` of the project, `undefined` for a file outside of any project.
 * @returns The instance of the project, the default one when no `tsconfig.json` is given.
 */
export function getProjectLanguageService(configPath: string | undefined): ProjectLanguageService {
  if (!configPath) {
    return defaultProjectLanguageService;
  }

  return projectLanguageServices.getOrInsertComputed(normalizeFileName(configPath), () => new ProjectLanguageService());
}

/**
 * Disposes the instances created for the TypeScript projects (see `getProjectLanguageService`), e.g. when the
 * language server shuts down. The default instance is left untouched.
 */
export function disposeProjectLanguageServices(): void {
  for (const instance of projectLanguageServices.values()) {
    instance.dispose();
  }

  projectLanguageServices.clear();
}

/**
 * Sets the unsaved text of a document open in an editor, read by every LanguageService in place of the file
 * on disk, so that a template sees the changes made to the class of its component before they are saved.
 *
 * @param fileName - The path of the document.
 * @param text - The text of the document.
 */
export function setDocumentOverlay(fileName: string, text: string): void {
  upsertEntry(documentOverlays, normalizeFileName(fileName), text);
}

/**
 * Removes the unsaved text of a document, e.g. when it is closed: the file on disk is read again.
 *
 * @param fileName - The path of the document.
 */
export function removeDocumentOverlay(fileName: string): void {
  documentOverlays.delete(normalizeFileName(fileName));
}

/**
 * Reads a file of the project: the unsaved text of the document, if it is open in an editor, or the file on disk.
 *
 * @param fileName - The path of the file.
 * @returns Its text, or `undefined` if it doesn't exist or cannot be read.
 */
export function readDocument(fileName: string): string | undefined {
  return documentOverlays.get(normalizeFileName(fileName))?.content ?? (sys.fileExists(fileName) ? sys.readFile(fileName) : undefined);
}

/**
 * Returns the shared LanguageService of the default instance (see {@link ProjectLanguageService.getLanguageService}).
 *
 * @param compilerOptions - The compilerOptions loaded from the project tsconfig.
 * @param fileNames - The project files loaded from the project tsconfig.
 * @returns The LanguageService.
 */
export function getLanguageService(compilerOptions: CompilerOptions, fileNames: readonly string[] = []): LanguageService {
  return defaultProjectLanguageService.getLanguageService(compilerOptions, fileNames);
}

/**
 * Disposes the LanguageService of the default instance and clears all associated state
 * (virtual files, real file version cache, known root files). Call this
 * from `configureServer` -> `httpServer.on('close', ...)`, or from
 * `closeBundle`, to avoid leaking a stale instance across server restarts.
 */
export function disposeLanguageService(): void {
  defaultProjectLanguageService.dispose();
}

/**
 * Reads the versions and the existence of the real files once for the default instance, until a change is reported
 * with {@link invalidateRealFile} (see {@link ProjectLanguageService.cacheRealFiles}).
 */
export function cacheRealFiles(): void {
  defaultProjectLanguageService.cacheRealFiles();
}

/**
 * Forgets what the default instance read of a real file that changed on disk (see
 * {@link ProjectLanguageService.invalidateRealFile}).
 *
 * @param fileName - The path of the file.
 * @param createdOrDeleted - Whether the file was created or deleted, rather than changed.
 */
export function invalidateRealFile(fileName: string, createdOrDeleted: boolean): void {
  defaultProjectLanguageService.invalidateRealFile(fileName, createdOrDeleted);
}

/**
 * Registers a real project file as a root file for the Program of the default instance.
 *
 * @param fileName - The path of the file.
 */
export function registerRealFile(fileName: string): void {
  defaultProjectLanguageService.registerRealFile(fileName);
}

/**
 * Removes a real project file from the default instance.
 *
 * @param filename - The path of the file.
 */
export function removeRealFile(filename: string): void {
  defaultProjectLanguageService.removeRealFile(filename);
}

/**
 * Updates (or creates) a virtual shim of the default instance.
 *
 * @param virtualPath - The path of the shim.
 * @param content - The source of the shim.
 */
export function upsertVirtualFile(virtualPath: string, content: string): void {
  defaultProjectLanguageService.upsertVirtualFile(virtualPath, content);
}

/**
 * Removes a virtual shim of the default instance.
 *
 * @param virtualPath - The path of the shim.
 */
export function removeVirtualFile(virtualPath: string): void {
  defaultProjectLanguageService.removeVirtualFile(virtualPath);
}

/**
 * Updates (or creates) a versioned entry, bumping its version only if its content actually changed.
 *
 * @param entries - The entries.
 * @param key - The key of the entry.
 * @param content - The new content.
 */
function upsertEntry(entries: Map<string, VirtualFileEntry>, key: string, content: string): void {
  const existing = entries.get(key);
  if (existing?.content !== content) {
    entries.set(key, {
      content,
      version: (existing?.version ?? 0) + 1,
    });
  }
}

/**
 * Reads a fact about a path from the disk the first time it is asked, then from the facts read.
 *
 * @param facts - The facts read, by the normalized path.
 * @param path - The path.
 * @param read - Reads the fact from the disk.
 * @returns The fact.
 */
function readOnce(facts: Map<string, boolean>, path: string, read: (path: string) => boolean): boolean {
  const key = normalizeFileName(path);
  let fact = facts.get(key);
  if (fact === undefined) {
    fact = read(path);
    facts.set(key, fact);
  }

  return fact;
}
