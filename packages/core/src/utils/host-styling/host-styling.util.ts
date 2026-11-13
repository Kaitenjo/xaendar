import { INTERNAL_HOST_DIRECTIVES, INTERNAL_HOST_PROPERTIES } from '../../costants';
import type { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { StylingOpinions } from '../../types/styling/styling-opinions.type';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';
import { addHostStylingSource, applyDirectStyling, createStylingState, getStylingState, hasHostStylingSources, removeHostStylingSource, removeStylingSource, setStylingSource } from '../styling-state/styling-state.util';
import { keyOpinion, stringOpinions, toExactLength } from '../styling-opinions/styling-opinions.util';

/**
 * The flags of the host properties of `class` and `style` each class declares, computed once per class.
 */
const stylingFlags = new WeakMap<object, number>();

/**
 * Registers a run of host properties of `class` or of `style` on its element, as a source of the attribute: when
 * another host source of the attribute was bound on the element before, and the element has no state yet, the state
 * merging them is created, holding the one bound before.
 *
 * @param run - The run, not run yet.
 */
export function registerHostStyling(run: HostStylingRun): void {
  const { element, attribute } = run;
  // The state takes the sources registered before this one, which registers in it once it runs
  if (hasHostStylingSources(element, attribute) && !getStylingState(element, attribute)) {
    createStylingState(element, attribute);
  }

  addHostStylingSource(element, attribute, run);
}

/**
 * Computes the opinions of the host properties of a run, reading the members of its owner (a member holding a signal or
 * any function is called), and writes them: through the state of the element, when it has one, otherwise directly, only
 * the keys whose value changed since the last run. The callback of the effect of the run.
 *
 * @param run - The run.
 */
export function applyHostStyling(run: HostStylingRun): void {
  const { host, element, attribute, bindings } = run;
  let keys: Array<string | boolean> | null = null;
  let string: StylingOpinions | null = null;
  for (let i = 0; i < bindings.length; i++) {
    const { name, unit, read } = bindings[i];
    const member = read(host);
    const value = typeof member === 'function' ? member() : member;
    if (!name) {
      string = stringOpinions(attribute, value);
      continue;
    }

    const opinion = keyOpinion(attribute, value, unit ?? '');
    if (opinion !== undefined) {
      keys ? keys.push(name, opinion) : keys = [name, opinion];
    }
  }

  if (keys) {
    keys = toExactLength(keys) as Array<string | boolean>;
  }

  const state = getStylingState(element, attribute);
  if (state) {
    setStylingSource(state, element, run, keys, string);
    return;
  }

  applyDirectStyling(element, attribute, run.keys, run.string, keys, string);
  run.keys = keys;
  run.string = string;
}

/**
 * Removes what a run wrote, unregistering it: through the state of the element, which writes again the value of the
 * sources below, or directly, removing the keys it made present.
 *
 * @param run - The run.
 */
export function removeHostStyling(run: HostStylingRun): void {
  const { element, attribute } = run;
  removeHostStylingSource(element, attribute, run);
  const state = getStylingState(element, attribute);
  if (state) {
    removeStylingSource(state, element, run);
  } else {
    applyDirectStyling(element, attribute, run.keys, run.string, null, null);
  }

  run.keys = null;
  run.string = null;
}

/**
 * Gives the attributes merged key by key a class of a directive or of a component writes with its host properties, and,
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
  const properties = metadata?.[INTERNAL_HOST_PROPERTIES];
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

  // The host directives belong to the class declaring them, as `_createHostDirectives` reads them
  const directives = metadata && Object.hasOwn(metadata, INTERNAL_HOST_DIRECTIVES) ? metadata[INTERNAL_HOST_DIRECTIVES] : undefined;
  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      const declaration = directives[i];
      flags |= _hostStylingFlags(typeof declaration === 'function' ? declaration : declaration.directive);
    }
  }

  return flags;
}
