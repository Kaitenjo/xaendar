import type { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import type { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { AttributeState } from '../../types/attributes/attribute-state.type';
import type { ElementSources } from '../../types/element-sources.type';
import type { HostRun } from '../../types/host/host-run.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import { ensureElementSources, getElementSources, getHostRuns } from '../element-sources/element-sources.util';
import { entrySize, findEntry, insertEntry, removeEntry } from '../source-rank/source-rank.util';
import { runValue } from '../styling-opinions/styling-opinions.util';
import { _attributeValue } from '../write-attribute/write-attribute.util';

/**
 * The values of the template of an element whose attributes are all merged, before it binds any (see
 * `ElementSources.template`).
 */
const NO_TEMPLATE_VALUES: readonly unknown[] = Object.freeze([]);

/**
 * Whether some elements merge all their attributes (see {@link _mergeAttributes}): until then, an attribute of the
 * template the compiler does not flag as shared never looks its state up.
 */
let merging = false;

/**
 * Gives the state merging the sources of an attribute of an element, if two levels write it.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns The state, `undefined` when the attribute is written by a single level, directly.
 */
export function getAttributeState(element: Element, name: string): AttributeState | undefined {
  const states = getElementSources(element)?.attributes;
  if (!states) {
    return undefined;
  }

  // A state starts with the name of its attribute, a list of states with a state
  if (typeof states[0] === 'string') {
    return states[0] === name ? states as AttributeState : undefined;
  }

  for (let i = 0; i < states.length; i++) {
    const state = states[i] as AttributeState;
    if (state[0] === name) {
      return state;
    }
  }

  return undefined;
}

/**
 * Tells whether some elements merge all their attributes (see {@link _mergeAttributes}): only then a source of the
 * template not flagged as shared looks its state up.
 *
 * @returns `true` once an element merges them.
 */
export function mergesAllAttributes(): boolean {
  return merging;
}

/**
 * Tells whether an element has a state merging the sources of an attribute: a helper of the tests, which check that an
 * attribute written by a single level has none.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns `true` when the element has a state.
 */
export function _hasAttributeState(element: Element, name: string): boolean {
  return !!getAttributeState(element, name);
}

/**
 * Merges every attribute of an element written through the runtime, whatever writes it: the state of an attribute is
 * created when a second level writes it, the values the template bound kept until then (see `ElementSources.template`).
 * The server writes so the elements of the components and of the directives, whose template, directives and component
 * it applies once each, in an order that is not the one of the precedence.
 *
 * @param element - The element.
 */
export function _mergeAttributes(element: Element): void {
  merging = true;
  ensureElementSources(element).template ??= NO_TEMPLATE_VALUES;
}

/**
 * Creates the state merging the sources of an attribute of an element, holding the ones that wrote it so far, directly:
 * the values the template bound on an element whose attributes are all merged, and the host runs bound on it. The
 * template registers its own bindings when they run, on an element rendered by the browser, the state being created
 * before (see `_prepareAttributes`).
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns The state.
 */
export function createAttributeState(element: Element, name: string): AttributeState {
  const record = ensureElementSources(element);
  let state: AttributeState = [name];
  const { template } = record;
  if (template) {
    for (let i = 0; i < template.length; i += 2) {
      if ((template[i] as RenderElementAttribute).name === name) {
        state = insertEntry(state, 1, template[i], 0, template[i + 1]);
      }
    }
  }

  const { hosts } = record;
  if (Array.isArray(hosts)) {
    for (let i = 0; i < hosts.length; i++) {
      if (writesAttribute(hosts[i], name)) {
        state = insertEntry(state, 1, hosts[i], hosts[i].rank, undefined);
      }
    }
  } else if (hosts && writesAttribute(hosts, name)) {
    state = insertEntry(state, 1, hosts, hosts.rank, undefined);
  }

  storeState(record, null, state);
  return state;
}

/**
 * Gives the state merging the sources of an attribute of an element, creating it when there is none.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns The state.
 */
export function ensureAttributeState(element: Element, name: string): AttributeState {
  return getAttributeState(element, name) ?? createAttributeState(element, name);
}

/**
 * Tells whether a source writes an attribute of an element directly, a state merging it being needed once another level
 * writes it too: a run of host attributes bound on the element, or the template of an element whose attributes are all
 * merged.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns `true` when one does.
 */
export function isAttributeWritten(element: Element, name: string): boolean {
  const template = getElementSources(element)?.template;
  if (template) {
    for (let i = 0; i < template.length; i += 2) {
      if ((template[i] as RenderElementAttribute).name === name) {
        return true;
      }
    }
  }

  return hostWritesAttribute(element, name);
}

/**
 * Tells whether a run of host attributes bound on an element writes an attribute.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns `true` when one does.
 */
export function hostWritesAttribute(element: Element, name: string): boolean {
  const hosts = getHostRuns(element);
  if (!Array.isArray(hosts)) {
    return !!hosts && writesAttribute(hosts, name);
  }

  return hosts.some(host => writesAttribute(host, name));
}

/**
 * Keeps the value the template binds to an attribute of an element whose attributes are all merged, while no state
 * merges the attribute (see `ElementSources.template`).
 *
 * @param record - The sources of the element.
 * @param attribute - The attribute, a constant of the module of the template.
 * @param value - The value.
 */
export function keepTemplateValue(record: ElementSources, attribute: RenderElementAttribute, value: unknown): void {
  const template = record.template!;
  for (let i = 0; i < template.length; i += 2) {
    if (template[i] === attribute) {
      (template as unknown[])[i + 1] = value;
      return;
    }
  }

  record.template = template.concat([attribute, value]);
}

/**
 * Gives the index of the host attribute of a run writing an attribute.
 *
 * @param run - The run.
 * @param name - The name of the attribute.
 * @returns The index, `-1` when the run does not write it.
 */
export function indexOfAttribute({ bindings }: HostAttributeRun, name: string): number {
  for (let i = 0; i < bindings.length; i++) {
    if (bindings[i].name === name) {
      return i;
    }
  }

  return -1;
}

/**
 * Sets the opinion of a source of a state, registering it if it is not there yet, and writes again the attribute with
 * the value of the strongest source having one.
 *
 * @param element - The element.
 * @param state - The state.
 * @param owner - What the source is: the constant of the attribute in the template, or a host run, holding its new value.
 * @param rank - Its rank (see `toRank`).
 * @param value - The value of a source of the template, `null` or `undefined` for no opinion.
 * @param previous - The value the source had, for a host run, whose state holds none.
 */
export function setAttributeOpinion(element: Element, state: AttributeState, owner: object, rank: number, value: unknown, previous?: unknown): void {
  const name = state[0] as string;
  let index = findEntry(state, 1, owner);
  let before: unknown;
  if (index === -1) {
    const inserted = insertEntry(state, 1, owner, rank, value);
    index = findEntry(inserted, 1, owner);
    before = resolveValue(inserted, index, undefined);
    storeState(getElementSources(element)!, state, inserted);
    state = inserted;
  } else if (entrySize(rank) === 3) {
    before = resolveValue(state, -1, undefined);
    state[index + 2] = value;
  } else {
    before = resolveValue(state, index, previous);
  }

  writeResolved(element, name, before, resolveValue(state, -1, undefined));
}

/**
 * Removes a source from a state, writing again the attribute: the value of the next source having an opinion comes
 * back, and the attribute no source has an opinion on any more is removed, if the sources gave it a text before.
 *
 * @param element - The element.
 * @param state - The state.
 * @param owner - What the source is.
 */
export function removeAttributeOpinion(element: Element, state: AttributeState, owner: object): void {
  const index = findEntry(state, 1, owner);
  if (index !== -1) {
    const before = resolveValue(state, -1, undefined);
    const removed = removeEntry(state, index);
    storeState(getElementSources(element)!, state, removed);
    writeResolved(element, state[0] as string, before, resolveValue(removed, -1, undefined));
  }
}

/**
 * Tells whether a host run writes an attribute: a run of host attributes, other than `class` and `style`, declaring it.
 *
 * @param run - The run.
 * @param name - The name of the attribute.
 * @returns `true` when it writes it.
 */
function writesAttribute(run: HostRun, name: string): boolean {
  return (run as HostStylingRun).attribute === undefined && indexOfAttribute(run as HostAttributeRun, name) !== -1;
}

/**
 * Stores a state among the ones of an element, in place of the one it replaces.
 *
 * @param record - The sources of the element.
 * @param replaced - The state replaced, `null` for a new one.
 * @param state - The state.
 */
function storeState(record: ElementSources, replaced: AttributeState | null, state: AttributeState): void {
  const states = record.attributes;
  if (!states || states === replaced) {
    record.attributes = state;
  } else if (typeof states[0] === 'string') {
    record.attributes = [states as AttributeState, state];
  } else if (replaced) {
    (states as AttributeState[])[(states as AttributeState[]).indexOf(replaced)] = state;
  } else {
    record.attributes = (states as AttributeState[]).concat([state]);
  }
}

/**
 * Gives the value of the strongest source of a state having an opinion.
 *
 * @param state - The state.
 * @param index - The index of a host run to read with another value, `-1` for none.
 * @param value - The value to read for that run.
 * @returns The value, `undefined` when no source has an opinion.
 */
function resolveValue(state: AttributeState, index: number, value: unknown): unknown {
  const name = state[0] as string;
  for (let i = 1; i < state.length; i += entrySize(state[i + 1] as number)) {
    const opinion = i === index ? value : entryValue(state, i, name);
    if (opinion !== undefined && opinion !== null) {
      return opinion;
    }
  }

  return undefined;
}

/**
 * Gives the value of a source of a state: the one kept for a source of the template, the one its run holds for a host
 * run.
 *
 * @param state - The state.
 * @param index - The index of the source.
 * @param name - The name of the attribute.
 * @returns The value.
 */
function entryValue(state: AttributeState, index: number, name: string): unknown {
  if (entrySize(state[index + 1] as number) === 3) {
    return state[index + 2];
  }

  const run = state[index] as HostAttributeRun;
  return runValue(run.values, run.bindings.length, indexOfAttribute(run, name));
}

/**
 * Writes an attribute of an element with the value of the strongest source of its state having an opinion, as
 * `writeAttribute` writes it (`false` removes it, unless it is an `aria-*` or an enumerated attribute), only when the
 * element does not hold it already, as an element adopted from the HTML of the server does. Without opinions, the
 * attribute is removed only if the sources gave it a text before, so that a value other code wrote stays.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param before - The value of the strongest source before the change.
 * @param value - The value of the strongest source.
 */
function writeResolved(element: Element, name: string, before: unknown, value: unknown): void {
  if (value === undefined) {
    if (before !== undefined && _attributeValue(name, before) !== null && element.hasAttribute(name)) {
      element.removeAttribute(name);
    }

    return;
  }

  const text = _attributeValue(name, value);
  if (element.getAttribute(name) !== text) {
    text === null ? element.removeAttribute(name) : element.setAttribute(name, text);
  }
}
