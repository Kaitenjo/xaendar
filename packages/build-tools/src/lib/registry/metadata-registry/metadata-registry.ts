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
const metadatas = new Map<string, MetadataEntry>();
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
const fileToKeys = new Map<string, Set<string>>();
/**
 * Timer handle for the periodic idle sweep.
 */
let sweepTimer: NodeJS.Timeout | undefined;

/**
 * Registers a metadata mapping for a component or directive.
 * @param key - The unique identifier for the metadata mapping
 * @param metadataMapping - The metadata object to register
 */
export function registerMetadataMapping(key: string, metadataMapping: ComponentOrDirectiveMetadata) {
  metadatas.set(key, {
    metadata: metadataMapping,
    lastAccessed: Date.now()
  });

  const ownerFile = getOwnerFilePath(metadataMapping);
  if (ownerFile) {
    fileToKeys.getOrInsert(ownerFile, new Set()).add(key);
  }

  ensureSweepStarted();
}

/**
 * Retrieves a metadata mapping by its key.
 * @param key - The unique identifier of the metadata mapping
 * @returns The metadata object if found, otherwise undefined
 */
export function getMetadataMapping(key: string): ComponentOrDirectiveMetadata | undefined {
  const entry = metadatas.get(key);
  if (entry) {
    entry.lastAccessed = Date.now();
    return entry.metadata;
  }
}

/**
 * Removes every metadata key previously registered from `filePath`, e.g. when
 * the file is re-transformed (stale className/selector keys from a prior
 * edit) or deleted.
 *
 * @param filePath - Absolute path of the owner source file.
 */
export function clearMetadataMappingsForFile(filePath: string): void {
  const keys = fileToKeys.get(filePath);
  if (keys) {
    for (const key of keys) {
      metadatas.delete(key);
    }

    fileToKeys.delete(filePath);
  }
}

/**
 * Resets the entire metadata registry and stops the idle sweep. Called on
 * dev server shutdown.
 */
export function clearMetadataRegistry(): void {
  metadatas.clear();
  fileToKeys.clear();

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
  const expiredKeys = new Set<string>();

  for (const [key, entry] of metadatas) {
    if (now - entry.lastAccessed > IDLE_TTL_MS) {
      metadatas.delete(key);
      expiredKeys.add(key);
    }
  }

  if (!expiredKeys.size) {
    return;
  }

  for (const [filePath, keys] of fileToKeys) {
    for (const key of expiredKeys) {
      /*
        We do not know which filepath could contain the timed-out key,
        so we check all file paths.
      */
      keys.delete(key);
    }

    if (!keys.size) {
      fileToKeys.delete(filePath);
    }
  }
}