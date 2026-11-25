import { describeUnsafeElementAttribute } from '@xaendar/internals';
import { INTERNAL_HOST_ATTRIBUTES } from '../../costants';
import type { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import { createAttributeState, getAttributeState, isAttributeWritten, removeAttributeOpinion, setAttributeOpinion } from '../attribute-state/attribute-state.util';
import { addHostRun, removeHostRun } from '../element-sources/element-sources.util';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';
import { _resolveHostDirectives } from '../host-directives/host-directives.util';
import { SECURITY } from '../security/security.util';
import { runValue } from '../styling-opinions/styling-opinions.util';
import { checkHostUrl } from '../url-check/url-check.util';
import { _attributeValue, writeAttribute } from '../write-attribute/write-attribute.util';

/**
 * The attributes, other than `class` and `style`, each class writes with its host attributes, computed once per class.
 */
const attributeNames = new WeakMap<object, readonly string[] | null>();

/**
 * Registers a run of host attributes of attributes on its element, as a source of each attribute: for an attribute
 * another run bound on the element before writes too, or the template of an element whose attributes are all merged,
 * when the element has no state for it yet, the state merging them is created, holding the opinion of the one that wrote
 * it before.
 *
 * An attribute that would lift a restriction of the element, as the `sandbox` of an `<iframe>` (see
 * `describeUnsafeElementAttribute`), throws while the `rejectUnsafeBindings` of the `security` of `xaendar.json` is on:
 * the decorator rejects the ones the browser runs on any element.
 *
 * @param run - The run, not run yet.
 * @throws If a host attribute would lift a restriction of the element.
 */
export function registerHostAttributes(run: HostAttributeRun): void {
  const { element, bindings } = run;
  for (let i = 0; i < bindings.length; i++) {
    const { name } = bindings[i];
    const unsafe = SECURITY.rejectUnsafeBindings ? describeUnsafeElementAttribute(element.localName, name, element) : undefined;
    if (unsafe) {
      throw new Error(`@HostAttribute('${name}') on <${element.localName}> ${unsafe}, or set "security": { "rejectUnsafeBindings": false } in xaendar.json to allow it.`);
    }

    // The state takes the sources registered before this one, which registers in it once it runs
    if (!getAttributeState(element, name) && isAttributeWritten(element, name)) {
      createAttributeState(element, name);
    }
  }

  addHostRun(run);
}

/**
 * Computes the value of a host attribute of a run, reading the member of its owner (a member holding a signal or any
 * function is called), checks the URLs it holds (see `checkHostUrl`), and writes it: through the state of the attribute,
 * when the element has one, otherwise directly (see `writeAttribute`). The callback of the effect of the property.
 *
 * @param run - The run.
 * @param index - The index of the property among the ones of the run.
 */
export function applyHostAttribute(run: HostAttributeRun, index: number): void {
  const { host, element, bindings } = run;
  const { name, read } = bindings[index];
  const member = read(host);
  const value = checkHostUrl(element, name, typeof member === 'function' ? member() : member);
  const previous = runValue(run.values, bindings.length, index);
  setRunValue(run, index, value);
  const state = getAttributeState(element, name);
  state ? setAttributeOpinion(element, state, run, run.rank, value, previous) : writeAttribute(element, name, value);
}

/**
 * Removes the opinions of a run, unregistering it: through the state of each attribute, which writes again the value of
 * the sources below, or directly, removing an attribute the run wrote, unless other code wrote it since.
 *
 * @param run - The run.
 */
export function removeHostAttributes(run: HostAttributeRun): void {
  const { element, bindings } = run;
  for (let i = 0; i < bindings.length; i++) {
    const { name } = bindings[i];
    const state = getAttributeState(element, name);
    if (state) {
      removeAttributeOpinion(element, state, run);
    } else {
      const text = _attributeValue(name, runValue(run.values, bindings.length, i));
      if (text !== null && element.getAttribute(name) === text) {
        element.removeAttribute(name);
      }
    }

    setRunValue(run, i, undefined);
  }

  removeHostRun(run);
}

/**
 * Gives the attributes, other than `class` and `style`, a class of a directive or of a component writes with its host
 * properties, and, for a component, the ones its host directives write, computed once per class.
 *
 * @param klass - The class.
 * @returns The names, `null` for none.
 */
export function _hostAttributeNames(klass: object): readonly string[] | null {
  let names = attributeNames.get(klass);
  if (names === undefined) {
    names = computeNames(klass);
    attributeNames.set(klass, names);
  }

  return names;
}

/**
 * Keeps the value a host attribute of a run computed (see `HostAttributeRun.values`).
 *
 * @param run - The run.
 * @param index - The index of the host attribute.
 * @param value - The value.
 */
function setRunValue(run: HostAttributeRun, index: number, value: unknown): void {
  if (run.bindings.length === 1) {
    run.values = value;
  } else {
    (run.values as unknown[])[index] = value;
  }
}

/**
 * Computes the names of {@link _hostAttributeNames}.
 *
 * @param klass - The class.
 * @returns The names, `null` for none.
 */
function computeNames(klass: object): readonly string[] | null {
  const metadata = getWebComponentMetadata(klass);
  let names: string[] | null = null;
  const properties = metadata?.[INTERNAL_HOST_ATTRIBUTES];
  if (properties?.length) {
    for (let i = 0; i < properties.length; i++) {
      const { kind, name } = properties[i];
      if (kind === 'attribute') {
        names = addName(names, name);
      }
    }
  }

  // The host directives of the ancestors included, as `_createHostDirectives` applies them
  const { directives } = _resolveHostDirectives(klass);
  if (directives.length) {
    for (let i = 0; i < directives.length; i++) {
      const directiveNames = _hostAttributeNames(directives[i].directive);
      if (directiveNames?.length) {
        for (let j = 0; j < directiveNames.length; j++) {
          names = addName(names, directiveNames[j]);
        }
      }
    }
  }

  return names;
}

/**
 * Adds a name to a list of names, once.
 *
 * @param names - The names, `null` for none.
 * @param name - The name.
 * @returns The names.
 */
function addName(names: string[] | null, name: string): string[] {
  if (!names) {
    return [name];
  }

  if (!names.includes(name)) {
    names.push(name);
  }

  return names;
}
