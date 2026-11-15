import type { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import type { AttributeOpinion } from '../../types/attributes/attribute-opinion.type';
import type { AttributeState } from '../../types/attributes/attribute-state.type';
import type { SourceRank } from '../../types/source-rank.type';
import { insertRanked, removeRanked } from '../source-rank/source-rank.util';
import { _attributeValue } from '../write-attribute/write-attribute.util';

/**
 * The states of the attributes, other than `class` and `style`, each element has: one, or an array of the exact length
 * from the second.
 */
const attributeStates = new WeakMap<Element, AttributeState | AttributeState[]>();

/**
 * The runs of host attributes bound on each element (see `HostAttributeRun`), so that the state created by a second
 * source finds the ones bound before.
 */
const hostAttributeSources = new WeakMap<Element, HostAttributeRun | HostAttributeRun[]>();

/**
 * The elements whose attributes are all merged, their states created when a source first writes them: the elements the
 * server writes through the runtime (see {@link _mergeAttributes}). `null` until the first one, so that the browser never
 * reads it.
 */
let mergedElements: WeakSet<Element> | null = null;

/**
 * Gives the state merging the sources of an attribute of an element, if more than one level writes it.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns The state, `undefined` when the attribute is written by a single source, directly.
 */
export function getAttributeState(element: Element, name: string): AttributeState | undefined {
  const states = attributeStates.get(element);
  if (!Array.isArray(states)) {
    return states?.name === name ? states : undefined;
  }

  for (let i = 0; i < states.length; i++) {
    if (states[i].name === name) {
      return states[i];
    }
  }

  return undefined;
}

/**
 * Gives the state a source writing an attribute of an element goes through: the one of the element, created on an
 * element whose attributes are all merged (see {@link _mergeAttributes}).
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns The state, `undefined` when the source writes the attribute directly.
 */
export function findAttributeState(element: Element, name: string): AttributeState | undefined {
  return getAttributeState(element, name) ?? (mergedElements?.has(element) ? createAttributeState(element, name) : undefined);
}

/**
 * Tells whether some elements merge all their attributes (see {@link _mergeAttributes}): only then a source of the
 * template not flagged as shared looks its state up.
 *
 * @returns `true` once an element merges them.
 */
export function mergesAllAttributes(): boolean {
  return mergedElements !== null;
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
 * created when a source first writes it. The server writes so the elements of the components and of the directives,
 * whose template, directives and component it applies once each, in an order that is not the one of the precedence.
 *
 * @param element - The element.
 */
export function _mergeAttributes(element: Element): void {
  (mergedElements ??= new WeakSet()).add(element);
}

/**
 * Creates the state merging the sources of an attribute of an element, holding the opinions of the host attributes bound
 * on it so far: the attribute holds the value of a single one, since a second one creates the state. The template
 * registers its own bindings when they run, the state being created before (see `_prepareAttributes`).
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns The state.
 */
export function createAttributeState(element: Element, name: string): AttributeState {
  const state: AttributeState = { name, opinions: null, written: false };
  const states = attributeStates.get(element);
  if (!states) {
    attributeStates.set(element, state);
  } else if (Array.isArray(states)) {
    states.push(state);
  } else {
    attributeStates.set(element, [states, state]);
  }

  const hosts = hostAttributeSources.get(element);
  if (Array.isArray(hosts)) {
    for (let i = 0; i < hosts.length; i++) {
      seedOpinion(state, hosts[i]);
    }
  } else if (hosts) {
    seedOpinion(state, hosts);
  }

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
 * Tells whether a run of host attributes bound on an element writes an attribute.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @returns `true` when one does.
 */
export function hasHostAttributeSource(element: Element, name: string): boolean {
  const hosts = hostAttributeSources.get(element);
  if (!Array.isArray(hosts)) {
    return !!hosts && indexOfAttribute(hosts, name) !== -1;
  }

  return hosts.some(host => indexOfAttribute(host, name) !== -1);
}

/**
 * Registers a run of host attributes bound on an element, so that a state created later holds its opinions.
 *
 * @param run - The run.
 */
export function addHostAttributeSource(run: HostAttributeRun): void {
  const { element } = run;
  const hosts = hostAttributeSources.get(element);
  if (!hosts) {
    hostAttributeSources.set(element, run);
  } else if (Array.isArray(hosts)) {
    hosts.push(run);
  } else {
    hostAttributeSources.set(element, [hosts, run]);
  }
}

/**
 * Unregisters a run of host attributes of an element.
 *
 * @param run - The run, registered.
 */
export function removeHostAttributeSource(run: HostAttributeRun): void {
  const { element } = run;
  const hosts = hostAttributeSources.get(element);
  if (!Array.isArray(hosts)) {
    hostAttributeSources.delete(element);
    return;
  }

  hosts.splice(hosts.indexOf(run), 1);
  if (hosts.length === 1) {
    hostAttributeSources.set(element, hosts[0]);
  }
}

/**
 * Gives the index of the host attribute of a run writing an attribute.
 *
 * @param run - The run.
 * @param name - The name of the attribute.
 * @returns The index, `-1` when the run does not write it.
 */
export function indexOfAttribute({ bindings }: HostAttributeRun, name: string): number {
  return bindings.findIndex(binding => binding.name === name);
}

/**
 * Sets the opinion of a source of a state, registering it if it is not there yet, and writes again the attribute with
 * the value of the strongest source having one.
 *
 * @param state - The state.
 * @param element - The element.
 * @param owner - What the source is (see `AttributeOpinion.owner`).
 * @param rank - Its level and its order.
 * @param value - Its value, `null` or `undefined` for no opinion.
 */
export function setAttributeOpinion(state: AttributeState, element: Element, owner: object, rank: SourceRank, value: unknown): void {
  const opinion = findOpinion(state, owner);
  if (opinion) {
    opinion.value = value;
  } else {
    state.opinions = insertRanked(state.opinions, { owner, tier: rank.tier, order: rank.order, value });
  }

  writeResolved(state, element);
}

/**
 * Removes a source from a state, writing again the attribute: the value of the next source having an opinion comes
 * back, and the attribute no source has an opinion on any more is removed, if the runtime wrote it.
 *
 * @param state - The state.
 * @param element - The element.
 * @param owner - What the source is.
 */
export function removeAttributeOpinion(state: AttributeState, element: Element, owner: object): void {
  const opinion = findOpinion(state, owner);
  if (opinion) {
    state.opinions = removeRanked(state.opinions, opinion);
    writeResolved(state, element);
  }
}

/**
 * Registers in a state the opinion of a run of host attributes bound before the state was created, if it has one on its
 * attribute: the runtime wrote the attribute when its value has a text.
 *
 * @param state - The state, just created.
 * @param run - The run.
 */
function seedOpinion(state: AttributeState, run: HostAttributeRun): void {
  const index = indexOfAttribute(run, state.name);
  const value = index === -1 ? undefined : run.values[index];
  if (value !== undefined && value !== null) {
    state.opinions = insertRanked(state.opinions, { owner: run, tier: run.tier, order: run.order, value });
    state.written ||= _attributeValue(state.name, value) !== null;
  }
}

/**
 * Gives the opinion a source registered in a state, if any.
 *
 * @param state - The state.
 * @param owner - What the source is.
 * @returns The opinion, `undefined` when the source registered none.
 */
function findOpinion({ opinions }: AttributeState, owner: object): AttributeOpinion | undefined {
  if (!Array.isArray(opinions)) {
    return opinions?.owner === owner ? opinions : undefined;
  }

  for (let i = 0; i < opinions.length; i++) {
    if (opinions[i].owner === owner) {
      return opinions[i];
    }
  }

  return undefined;
}

/**
 * Gives the value of the strongest source of a state having an opinion.
 *
 * @param state - The state.
 * @returns The value, `undefined` when no source has an opinion.
 */
function resolveValue({ opinions }: AttributeState): unknown {
  if (!Array.isArray(opinions)) {
    return opinions?.value ?? undefined;
  }

  for (let i = 0; i < opinions.length; i++) {
    const { value } = opinions[i];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

/**
 * Writes an attribute of an element with the value of the strongest source of its state having an opinion, as
 * `writeAttribute` writes it (`false` removes it, unless it is an `aria-*` or an enumerated attribute), only when the
 * element does not hold it already, as an element adopted from the HTML of the server does. Without opinions, the
 * attribute is removed only if the runtime wrote it.
 *
 * @param state - The state.
 * @param element - The element.
 */
function writeResolved(state: AttributeState, element: Element): void {
  const { name } = state;
  const value = resolveValue(state);
  if (value === undefined) {
    if (state.written && element.hasAttribute(name)) {
      element.removeAttribute(name);
    }

    state.written = false;
    return;
  }

  const text = _attributeValue(name, value);
  if (element.getAttribute(name) !== text) {
    text === null ? element.removeAttribute(name) : element.setAttribute(name, text);
  }

  state.written = text !== null;
}
