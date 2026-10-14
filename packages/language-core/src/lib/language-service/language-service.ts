import { statSync } from 'node:fs';
import { CompilerOptions, createDocumentRegistry, createLanguageService, getDefaultLibFilePath, LanguageService, LanguageServiceHost, ScriptSnapshot, sys } from 'typescript';
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
 * A generated TS shim, with the version the LanguageService uses to tell when to re-check it.
 */
type VirtualFileEntry = {
  /**
   * The source of the shim.
   */
  content: string;
  /**
   * The version of the shim, bumped whenever its content changes.
   */
  version: number;
};

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
    this._realFiles.clear();
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
      fileExists: fileName => this._virtualFiles.has(fileName) || documentOverlays.has(normalizeFileName(fileName)) || sys.fileExists(fileName),
      readFile: fileName => this._readFile(fileName),
      readDirectory: sys.readDirectory,
      directoryExists: sys.directoryExists,
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
    return this._virtualFiles.get(fileName)?.content ?? readDocument(fileName);
  }

  /**
   * Synthetic version string for a real file, based on its mtime, so the
   * LanguageService can detect when a source file has changed on disk.
   * Falls back to the last known version (or '0') if the file can no longer
   * be stat'd, to avoid spurious invalidation churn.
   *
   * @param fileName - The path of the file.
   * @returns The version of the file.
   */
  private _getRealFileVersion(fileName: string): string {
    try {
      const version = String(statSync(fileName).mtimeMs);
      this._realFileVersions.set(fileName, version);
      return version;
    } catch {
      return this._realFileVersions.get(fileName) ?? '0';
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
