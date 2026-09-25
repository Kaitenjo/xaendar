import { ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { MetadataEntry } from '../../types/metadata-entry';

/**
 * Entries idle for longer than this are reclaimed by the sweep (see `sweepIdleEntries`).
 */
const IDLE_TTL_MS = 5 * 60_000;
/**
 * How often the idle sweep runs; a fraction of `IDLE_TTL_MS` for reasonably prompt reclamation.
 */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Metadata registry storing component and directive metadata entries keyed by unique identifiers.
 * (e.g.)
 *   {
 *     "TopbarComponent": {
 *       metadata: { ... },
 *       lastAccessed: 1680000000000
 *     }
 *   }
 *
 */
const metadatas = new Map<string, Map<string, MetadataEntry>>();
/**
 * Map component file paths to the metadata extracted
 *
 * This allows to track whenever a Component Class Name has been changed
 * to permit his cancellation
 * (e.g.)
 *   {
 *     "/src/app/shell/shell.xd.component.ts": new Set(["ShellComponent"])
 *   }
 */
const filePathToMetadataKeys = new Map<string, Set<string>>();
/**
 * Timer handle for the periodic idle sweep.
 */
let sweepTimer: NodeJS.Timeout | undefined;

/**
 * Registers a metadata mapping for a component or directive.
 * @param key - The unique identifier for the metadata mapping
 * @param metadataMapping - The metadata object to register
 */
export function registerMetadata(key: string, metadataMapping: ComponentOrDirectiveMetadata) {
  const ownerFile = getOwnerFilePath(metadataMapping);
  if (!ownerFile) {
    return;
  }

  metadatas.getOrInsert(key, new Map()).set(ownerFile, {
    metadata: metadataMapping,
    lastAccessed: Date.now()
  });

  filePathToMetadataKeys.getOrInsert(ownerFile, new Set()).add(key);

  ensureSweepStarted();
}

/**
 * Retrieves a metadata mapping by its key.
 * @param key - The unique identifier of the metadata mapping
 * @returns The metadata object if found, otherwise undefined
 */
export function getMetadata(key: string, ownerFile?: string): ComponentOrDirectiveMetadata | undefined {
  const entries = metadatas.get(key);
  if (!entries?.size) {
    return;
  }

  const entry = ownerFile ? entries.get(ownerFile) : (entries.size === 1 ? entries.values().next().value : undefined);
  if (!entry) {
    return;
  }

  entry.lastAccessed = Date.now();
  return entry.metadata;
}

/**
 * Removes every metadata key previously registered from `filePath`, e.g. when
 * the file is re-transformed (stale className/selector keys from a prior
 * edit) or deleted.
 *
 * @param filePath - Absolute path of the owner source file.
 */
export function clearMetadataForFile(filePath: string): void {
  const keys = filePathToMetadataKeys.get(filePath);
  if (keys) {
    for (const key of keys) {
      const entries = metadatas.get(key);
      entries?.delete(filePath);
      if (!entries?.size) {
        metadatas.delete(key);
      }
    }

    filePathToMetadataKeys.delete(filePath);
  }
}

/**
 * Resets the entire metadata registry and stops the idle sweep. Called on
 * dev server shutdown.
 */
export function clearMetadataRegistry(): void {
  metadatas.clear();
  filePathToMetadataKeys.clear();

  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = undefined;
  }
}

/**
 * Derives the absolute path of the file a metadata entry was extracted from,
 * used to key the `fileToKeys` reverse index.
 */
function getOwnerFilePath(metadata: ComponentOrDirectiveMetadata): string | undefined {
  return metadata.typescriptNodes.klass.getSourceFile().fileName || undefined;
}

/**
 * Lazily starts the periodic idle sweep on first registration. `unref()`d so
 * a lingering timer never keeps a `vite build`/CI process alive.
 */
function ensureSweepStarted(): void {
  sweepTimer ??= setInterval(sweepIdleEntries, SWEEP_INTERVAL_MS).unref();
}

/**
 * Reclaims entries that haven't been read or written for longer than
 * `IDLE_TTL_MS`, independent of whether their owner file is still valid.
 */
function sweepIdleEntries(): void {
  const now = Date.now();

  for (const [key, entries] of metadatas) {
    for (const [filePath, entry] of entries) {
      if (now - entry.lastAccessed > IDLE_TTL_MS) {
        entries.delete(filePath);

        const keys = filePathToMetadataKeys.get(filePath);
        keys?.delete(key);
        if (!keys?.size) {
          filePathToMetadataKeys.delete(filePath);
        }
      }
    }

    if (!entries.size) {
      metadatas.delete(key);
    }
  }
}