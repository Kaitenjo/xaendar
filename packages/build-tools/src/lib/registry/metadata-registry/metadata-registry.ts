import { ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { MetadataEntry } from '../../types/metadata-entry';
import type { SelectorOwner } from '../../types/selector-owner.type';

/**
 * Entries idle for longer than this are reclaimed by the sweep (see `sweepIdleEntries`).
 */
const IDLE_TTL_MS = 5 * 60_000;
/**
 * How often the idle sweep runs; a fraction of `IDLE_TTL_MS` for reasonably prompt reclamation.
 */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Metadata registry storing component and directive metadata entries keyed by class name.
 * The value is a map to support multiple component with the same ClassName across different files.
 * (e.g.)
 *   {
 *     "TopbarComponent": Map{
 *       "/src/app/topbar/topbar.xd.component.ts": {
 *         metadata: { ... },
 *         lastAccessed: 1680000000000
 *       },
 *       "/src/app2/topbar/topbar.xd.component.ts": {
 *         metadata: { ... },
 *         lastAccessed: 1680000000000
 *       }
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
 * Maps each selector to the single component or directive owning it: unlike class names, selectors must be
 * unique, as a custom element name, or a directive selector, can be defined only once at runtime.
 * Directive selectors are keyed as they are applied in templates (`@@selector`, see {@link getSelectorKey}),
 * so they never clash with custom element names.
 * Ownerships are not reclaimed by the idle sweep, otherwise a duplicated selector declared after
 * the sweep of its first owner would go unnoticed.
 * (e.g.)
 *   {
 *     "xd-topbar": { ownerFile: "/src/app/topbar/topbar.xd.component.ts", className: "TopbarComponent" }
 *   }
 */
const selectorOwners = new Map<string, SelectorOwner>();
/**
 * Maps component file paths to the selectors they own, to release them when the file is
 * re-transformed or deleted.
 * (e.g.)
 *   {
 *     "/src/app/topbar/topbar.xd.component.ts": new Set(["xd-topbar"])
 *   }
 */
const filePathToSelectors = new Map<string, Set<string>>();
/**
 * Timer handle for the periodic idle sweep.
 */
let sweepTimer: NodeJS.Timeout | undefined;

/**
 * Registers a metadata mapping for a component or directive.
 * @param className - The class name of the component or directive
 * @param metadataMapping - The metadata object to register
 */
export function registerMetadata(className: string, metadataMapping: ComponentOrDirectiveMetadata) {
  const ownerFile = getOwnerFilePath(metadataMapping);
  if (!ownerFile) {
    return;
  }

  metadatas.getOrInsert(className, new Map()).set(ownerFile, {
    metadata: metadataMapping,
    lastAccessed: Date.now()
  });

  filePathToMetadataKeys.getOrInsert(ownerFile, new Set()).add(className);

  ensureSweepStarted();
}

/**
 * Retrieves a metadata mapping by the class name or by one of the selectors of its component.
 * @param classNameOrSelector - The class name, or a selector, of the component or directive
 * @param ownerFile - The file declaring the class, ignored for selectors as they have a single owner
 * @returns The metadata object if found, otherwise undefined
 */
export function getMetadata(classNameOrSelector: string, ownerFile?: string): ComponentOrDirectiveMetadata | undefined {
  const owner = selectorOwners.get(classNameOrSelector);
  const className = owner?.className ?? classNameOrSelector;
  const file = owner?.ownerFile ?? ownerFile;

  const entries = metadatas.get(className);
  if (!entries?.size) {
    return;
  }

  const entry = file ? entries.get(file) : (entries.size === 1 ? entries.values().next().value : undefined);
  if (!entry) {
    return;
  }

  entry.lastAccessed = Date.now();
  return entry.metadata;
}

/**
 * Retrieves the component owning a selector.
 * @param selector - The custom element selector
 * @returns The owner of the selector, or undefined if no component registered it
 */
export function getSelectorOwner(selector: string): SelectorOwner | undefined {
  return selectorOwners.get(selector);
}

/**
 * Registers the component or directive described by `metadataMapping` as the owner of its selector,
 * replacing any previous owner: conflicts must be checked beforehand via {@link getSelectorOwner}.
 * @param metadataMapping - The metadata of the component or directive owning the selectors
 * @param ownerFile - The absolute path of the file declaring the component or directive.
 */
export function registerSelectors(metadataMapping: ComponentOrDirectiveMetadata, ownerFile: string): void {
  const selector = getSelectorKey(metadataMapping);
  releaseSelector(selector);
  selectorOwners.set(selector, { ownerFile, className: metadataMapping.className });
  filePathToSelectors.getOrInsert(ownerFile, new Set()).add(selector);
}

/**
 * Returns the key identifying the selector of a component or a directive in the registry:
 * the custom element name for a component, the selector as applied in templates (`@@selector`)
 * for a directive, so the two never clash.
 * @param metadataMapping - The metadata of the component or directive
 * @returns The registry key of the selector
 */
export function getSelectorKey({ type, selector }: ComponentOrDirectiveMetadata): string {
  return type === 'directive' ? `@@${selector}` : selector;
}

/**
 * Releases a selector from its owner, e.g. when the owner file no longer declares it.
 * @param selector - The custom element selector
 */
export function releaseSelector(selector: string): void {
  const owner = selectorOwners.get(selector);
  if (!owner) {
    return;
  }

  selectorOwners.delete(selector);

  const selectors = filePathToSelectors.get(owner.ownerFile);
  selectors?.delete(selector);
  if (!selectors?.size) {
    filePathToSelectors.delete(owner.ownerFile);
  }
}

/**
 * Removes every metadata key and selector previously registered from `filePath`, e.g. when
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

  const selectors = filePathToSelectors.get(filePath);
  if (selectors) {
    for (const selector of selectors) {
      selectorOwners.delete(selector);
    }

    filePathToSelectors.delete(filePath);
  }
}

/**
 * Resets the entire metadata registry and stops the idle sweep. Called on
 * dev server shutdown.
 */
export function clearMetadataRegistry(): void {
  metadatas.clear();
  filePathToMetadataKeys.clear();
  selectorOwners.clear();
  filePathToSelectors.clear();

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
 * Selector ownerships are kept (see `selectorOwners`).
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
