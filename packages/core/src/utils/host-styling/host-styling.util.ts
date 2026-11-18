import { INTERNAL_HOST_ATTRIBUTES } from '../../costants';
import type { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import { addHostRun, getElementSources, removeHostRun } from '../element-sources/element-sources.util';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';
import { _resolveHostDirectives } from '../host-directives/host-directives.util';
import { hostKeys, hostString } from '../styling-opinions/styling-opinions.util';
import { applyDirectStyling, createStylingState, removeStylingSource, setHostStyling, sharesNewKey } from '../styling-state/styling-state.util';

/**
 * The flags of the host attributes of `class` and `style` each class declares, computed once per class.
 */
const stylingFlags = new WeakMap<object, number>();

/**
 * Registers a run of host attributes of `class` or of `style` on its element, so that the sources writing the same keys
 * find it (see `sharesNewKey`).
 *
 * @param run - The run, not run yet.
 */
export function registerHostStyling(run: HostStylingRun): void {
  addHostRun(run);
}

/**
 * Computes the values of the host attributes of a run, reading the members of its owner (a member holding a signal or
 * any function is called), and writes their opinions: through the state of the element, when it has one, otherwise
 * directly, only the keys whose value changed since the last run. A key another source has an opinion on creates the
 * state merging them. The callback of the effect of the run.
 *
 * @param run - The run.
 */
export function applyHostStyling(run: HostStylingRun): void {
  const { host, element, attribute, bindings } = run;
  const single = bindings.length === 1;
  const values = single ? undefined : new Array<unknown>(bindings.length);
  let value: unknown;
  for (let i = 0; i < bindings.length; i++) {
    const member = bindings[i].read(host);
    value = typeof member === 'function' ? member() : member;
    if (!single) {
      (values as unknown[])[i] = value;
    }
  }

  const previous = run.values;
  run.values = single ? value : values;
  const record = getElementSources(element);
  if (Array.isArray(record?.[attribute])) {
    setHostStyling(element, record!, run, previous);
    return;
  }

  const previousKeys = hostKeys(run, previous);
  const previousString = hostString(run, previous);
  const keys = hostKeys(run, run.values);
  const string = hostString(run, run.values);
  if (record && sharesNewKey(record, attribute, run, previousKeys, previousString, keys, string)) {
    // The state holds the run, which writes its new values through it
    createStylingState(element, attribute);
    setHostStyling(element, record, run, previous);
    return;
  }

  applyDirectStyling(element, attribute, previousKeys, previousString, keys, string);
}

/**
 * Removes what a run wrote, unregistering it: through the state of the element, which writes again the value of the
 * sources below, or directly, removing the keys it made present.
 *
 * @param run - The run.
 */
export function removeHostStyling(run: HostStylingRun): void {
  const { element, attribute } = run;
  if (Array.isArray(getElementSources(element)?.[attribute])) {
    removeStylingSource(element, attribute, run);
  } else {
    applyDirectStyling(element, attribute, hostKeys(run, run.values), hostString(run, run.values), null, null);
  }

  removeHostRun(run);
  run.values = undefined;
}

/**
 * Gives the attributes merged key by key a class of a directive or of a component writes with its host attributes, and,
 * for a component, the ones its host directives write: `1` for `class`, `2` for `style`, computed once per class.
 *
 * @param klass - The class.
 * @returns The flags.
 */
export function _hostStylingFlags(klass: object): number {
  let flags = stylingFlags.get(klass);
  if (flags === undefined) {
    flags = computeFlags(klass);
    stylingFlags.set(klass, flags);
  }

  return flags;
}

/**
 * Computes the flags of {@link _hostStylingFlags}.
 *
 * @param klass - The class.
 * @returns The flags.
 */
function computeFlags(klass: object): number {
  const metadata = getWebComponentMetadata(klass);
  let flags = 0;
  const properties = metadata?.[INTERNAL_HOST_ATTRIBUTES];
  if (properties?.length) {
    for (let i = 0; i < properties.length; i++) {
      switch (properties[i].kind) {
        case 'class':
          flags |= 1;
          break;

        case 'style':
          flags |= 2;
          break;
      }
    }
  }

  // The host directives of the ancestors included, as `_createHostDirectives` applies them
  const { directives } = _resolveHostDirectives(klass);
  if (directives.length) {
    for (let i = 0; i < directives.length; i++) {
      flags |= _hostStylingFlags(directives[i].directive);
    }
  }

  return flags;
}
