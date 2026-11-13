import { stylePriority, styleValue } from '@xaendar/common';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import type { StylingOpinions } from '../../types/styling/styling-opinions.type';
import type { StylingSource } from '../../types/styling/styling-source.type';
import type { StylingState } from '../../types/styling/styling-state.type';

/**
 * The states of the elements whose `class` is written by more than one source.
 */
const classStates = new WeakMap<Element, StylingState>();

/**
 * The states of the elements whose `style` is written by more than one source.
 */
const styleStates = new WeakMap<Element, StylingState>();

/**
 * The host properties of `class` bound on each element (see `HostStylingRun`), so that the state created by the second
 * source finds the ones bound before.
 */
const classHostSources = new WeakMap<Element, StylingSource | StylingSource[]>();

/**
 * The host properties of `style` bound on each element, as {@link classHostSources}.
 */
const styleHostSources = new WeakMap<Element, StylingSource | StylingSource[]>();

/**
 * Gives the state merging the sources of an attribute of an element, if more than one writes it.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns The state, `undefined` when the attribute is written by a single source, directly.
 */
export function getStylingState(element: Element, attribute: StylingAttribute): StylingState | undefined {
  return (attribute === 'class' ? classStates : styleStates).get(element);
}

/**
 * Tells whether an element has a state merging the sources of an attribute: a helper of the tests, which check that an
 * element written by a single source has none.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns `true` when the element has a state.
 */
export function _hasStylingState(element: Element, attribute: StylingAttribute): boolean {
  return !!getStylingState(element, attribute);
}

/**
 * Creates the state merging the sources of an attribute of an element, holding the host properties bound on it so far,
 * whose keys are the ones the runtime wrote: a single one, since a second one creates the state. The template registers
 * its own bindings when they run, the state being created before (see `_prepareStyling`).
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns The state.
 */
export function createStylingState(element: Element, attribute: StylingAttribute): StylingState {
  const state: StylingState = { attribute, sources: null, written: null };
  (attribute === 'class' ? classStates : styleStates).set(element, state);
  const hosts = (attribute === 'class' ? classHostSources : styleHostSources).get(element);
  if (Array.isArray(hosts)) {
    for (let i = 0; i < hosts.length; i++) {
      insertSource(state, hosts[i]);
    }
  } else if (hosts) {
    insertSource(state, hosts);
    state.written = presentKeys(hosts.keys, hosts.string);
  }

  return state;
}

/**
 * Gives the state merging the sources of an attribute of an element, creating it when there is none.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns The state.
 */
export function ensureStylingState(element: Element, attribute: StylingAttribute): StylingState {
  return getStylingState(element, attribute) ?? createStylingState(element, attribute);
}

/**
 * Tells whether host property sources of an attribute are bound on an element.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns `true` when at least one is bound.
 */
export function hasHostStylingSources(element: Element, attribute: StylingAttribute): boolean {
  return (attribute === 'class' ? classHostSources : styleHostSources).has(element);
}

/**
 * Registers a host property source bound on an element, so that a state created later holds it.
 *
 * @param element - The element.
 * @param attribute - The attribute it writes.
 * @param source - The source.
 */
export function addHostStylingSource(element: Element, attribute: StylingAttribute, source: StylingSource): void {
  const map = attribute === 'class' ? classHostSources : styleHostSources;
  const sources = map.get(element);
  if (!sources) {
    map.set(element, source);
  } else if (Array.isArray(sources)) {
    sources.push(source);
  } else {
    map.set(element, [sources, source]);
  }
}

/**
 * Unregisters a host property source of an element.
 *
 * @param element - The element.
 * @param attribute - The attribute it writes.
 * @param source - The source.
 */
export function removeHostStylingSource(element: Element, attribute: StylingAttribute, source: StylingSource): void {
  const map = attribute === 'class' ? classHostSources : styleHostSources;
  const sources = map.get(element);
  if (!Array.isArray(sources)) {
    map.delete(element);
    return;
  }

  sources.splice(sources.indexOf(source), 1);
  if (sources.length === 1) {
    map.set(element, sources[0]);
  }
}

/**
 * Gives the source of a state an owner registered, if any.
 *
 * @param state - The state.
 * @param owner - The owner of the source (see `StylingSource.owner`).
 * @returns The source, `undefined` when the owner registered none.
 */
export function findStylingSource(state: StylingState, owner: object): StylingSource | undefined {
  const { sources } = state;
  if (!Array.isArray(sources)) {
    return sources?.owner === owner ? sources : undefined;
  }

  for (let i = 0; i < sources.length; i++) {
    if (sources[i].owner === owner) {
      return sources[i];
    }
  }

  return undefined;
}

/**
 * Sets the opinions of a source of a state, registering it if it is not there yet, and writes again the keys it had or
 * has an opinion on, each with the value of the strongest source having one.
 *
 * @param state - The state.
 * @param element - The element.
 * @param source - The source.
 * @param keys - Its opinions on the keys bound one by one, `null` for none.
 * @param string - Its opinions from its string, `null` for none.
 */
export function setStylingSource(state: StylingState, element: Element, source: StylingSource, keys: StylingOpinions | null, string: StylingOpinions | null): void {
  let previousKeys: StylingOpinions | null = null;
  let previousString: StylingOpinions | null = null;
  if (findStylingSource(state, source.owner) === source) {
    previousKeys = source.keys;
    previousString = source.string;
  } else {
    insertSource(state, source);
  }

  source.keys = keys;
  source.string = string;
  forEachKey(previousKeys, previousString, keys, string, key => writeResolved(state, element, key));
}

/**
 * Removes a source from a state, writing again the keys it had an opinion on: the value of the next source having one
 * comes back, and a key no source has an opinion on any more is removed, if the runtime wrote it.
 *
 * @param state - The state.
 * @param element - The element.
 * @param owner - The owner of the source.
 */
export function removeStylingSource(state: StylingState, element: Element, owner: object): void {
  const source = findStylingSource(state, owner);
  if (!source) {
    return;
  }

  const { sources } = state;
  if (Array.isArray(sources)) {
    sources.splice(sources.indexOf(source), 1);
    state.sources = sources.length === 1 ? sources[0] : sources;
  } else {
    state.sources = null;
  }

  forEachKey(source.keys, source.string, null, null, key => writeResolved(state, element, key));
}

/**
 * Writes an attribute of an element written by a single source, directly: only the keys whose value changes from the
 * opinions the source had to the ones it has, the keys bound one by one winning over the string. A key the source no
 * longer has an opinion on is removed only when it was present by its opinion, so that a key written by other code
 * stays. Each key is written only when the element does not hold its value already, as an element adopted from the HTML
 * of the server does.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param previousKeys - The opinions the source had on the keys bound one by one.
 * @param previousString - The opinions the source had from its string.
 * @param keys - The opinions it has on the keys bound one by one.
 * @param string - The opinions it has from its string.
 */
export function applyDirectStyling(element: Element, attribute: StylingAttribute, previousKeys: StylingOpinions | null, previousString: StylingOpinions | null, keys: StylingOpinions | null, string: StylingOpinions | null): void {
  forEachKey(previousKeys, previousString, keys, string, key => {
    const previous = resolveOpinion(previousKeys, previousString, key);
    const value = resolveOpinion(keys, string, key);
    if (previous !== value) {
      writeKey(element, attribute, key, value, previous !== undefined && previous !== false);
    }
  });
}

/**
 * Writes the whole attribute of an element not holding it yet, written by a single source: the classes present, or the
 * declarations, by the opinions of the source, the keys bound one by one winning over the string.
 *
 * @param element - The element, without the attribute.
 * @param attribute - The attribute.
 * @param keys - The opinions of the source on the keys bound one by one.
 * @param string - The opinions of the source from its string.
 */
export function writeStylingAttribute(element: Element, attribute: StylingAttribute, keys: StylingOpinions | null, string: StylingOpinions | null): void {
  let text = '';
  forEachKey(null, null, keys, string, key => {
    const value = resolveOpinion(keys, string, key);
    if (value === true) {
      text = text ? `${text} ${key}` : key;
    } else if (typeof value === 'string') {
      text = text ? `${text} ${key}: ${value};` : `${key}: ${value};`;
    }
  });

  if (text) {
    element.setAttribute(attribute, text);
  }
}

/**
 * Gives the value of a key by the opinions of a source: the one of the keys bound one by one, otherwise the one of its
 * string.
 *
 * @param keys - The opinions on the keys bound one by one.
 * @param string - The opinions from the string.
 * @param key - The key.
 * @returns The value, `undefined` when the source has no opinion on the key.
 */
export function resolveOpinion(keys: StylingOpinions | null, string: StylingOpinions | null, key: string): string | boolean | undefined {
  const value = findOpinion(keys, key);
  return value === undefined ? findOpinion(string, key) : value;
}

/**
 * Inserts a source among the ones of a state, keeping them from the strongest: by level, then from the greatest order.
 *
 * @param state - The state.
 * @param source - The source.
 */
function insertSource(state: StylingState, source: StylingSource): void {
  const { sources } = state;
  if (!sources) {
    state.sources = source;
    return;
  }

  // The second source gets an array of exactly two items: a push into an empty array would reserve room for many more
  if (!Array.isArray(sources)) {
    state.sources = isStronger(source, sources) ? [source, sources] : [sources, source];
    return;
  }

  let index = 0;
  while (index < sources.length && !isStronger(source, sources[index])) {
    index++;
  }

  sources.splice(index, 0, source);
}

/**
 * Tells whether a source wins over another one: of a lower level, or, in the same level, of a greater order.
 *
 * @param source - The source.
 * @param other - The other source.
 * @returns `true` when the source wins.
 */
function isStronger(source: StylingSource, other: StylingSource): boolean {
  return source.tier < other.tier || (source.tier === other.tier && source.order > other.order);
}

/**
 * Writes a key of an element with the value of the strongest source of the state having an opinion on it, removing it,
 * when no source has one, only if the runtime wrote it.
 *
 * @param state - The state.
 * @param element - The element.
 * @param key - The key.
 */
function writeResolved(state: StylingState, element: Element, key: string): void {
  const value = resolveState(state, key);
  const written = isWritten(state.written, key);
  writeKey(element, state.attribute, key, value, written);
  if (value === true || typeof value === 'string') {
    if (!written) {
      state.written = addKey(state.written, key);
    }
  } else if (written) {
    state.written = removeKey(state.written, key);
  }
}

/**
 * Gives the value of a key by the sources of a state: in each level, from the strongest, the keys bound one by one of
 * its sources, from the greatest order, then their strings.
 *
 * @param state - The state.
 * @param key - The key.
 * @returns The value, `undefined` when no source has an opinion on the key.
 */
function resolveState({ sources }: StylingState, key: string): string | boolean | undefined {
  if (!Array.isArray(sources)) {
    return sources ? resolveOpinion(sources.keys, sources.string, key) : undefined;
  }

  let start = 0;
  while (start < sources.length) {
    const { tier } = sources[start];
    let end = start;
    while (end < sources.length && sources[end].tier === tier) {
      const value = findOpinion(sources[end].keys, key);
      if (value !== undefined) {
        return value;
      }

      end++;
    }

    for (let i = start; i < end; i++) {
      const value = findOpinion(sources[i].string, key);
      if (value !== undefined) {
        return value;
      }
    }

    start = end;
  }

  return undefined;
}

/**
 * Writes a key of an element, only when the element does not hold the value already:
 * - a class is added for `true` and removed for `false`, a property set to a string, with its priority;
 * - without value, a key is removed only if it was present by the opinion of the runtime.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param key - The key.
 * @param value - The value, `undefined` for none.
 * @param written - Whether the key was present by the opinion of the runtime.
 */
function writeKey(element: Element, attribute: StylingAttribute, key: string, value: string | boolean | undefined, written: boolean): void {
  if (attribute === 'class') {
    const { classList } = element;
    if (value === true) {
      classList.contains(key) || classList.add(key);
    } else if ((value === false || written) && classList.contains(key)) {
      classList.remove(key);
    }

    return;
  }

  // Every element a template renders, HTML, SVG or MathML, has the inline style of an HTMLElement
  const { style } = element as HTMLElement;
  if (typeof value === 'string') {
    const text = styleValue(value);
    const priority = stylePriority(value);
    if (style.getPropertyValue(key) !== text || style.getPropertyPriority(key) !== priority) {
      style.setProperty(key, text, priority);
    }
  } else if (written && style.getPropertyValue(key)) {
    style.removeProperty(key);
  }
}

/**
 * Gives the value of a key in a list of opinions.
 *
 * @param opinions - The opinions, `null` for none.
 * @param key - The key.
 * @returns The value, `undefined` when the list has no opinion on the key.
 */
function findOpinion(opinions: StylingOpinions | null, key: string): string | boolean | undefined {
  if (opinions) {
    // The keys are at the even indices: a value may be equal to a key, as `color` of `transition-property`
    for (let i = 0; i < opinions.length; i += 2) {
      if (opinions[i] === key) {
        return opinions[i + 1];
      }
    }
  }

  return undefined;
}

/**
 * Calls a function once for every key of four lists of opinions: the ones a source had and the ones it has.
 *
 * @param previousKeys - The opinions it had on the keys bound one by one.
 * @param previousString - The opinions it had from its string.
 * @param keys - The opinions it has on the keys bound one by one.
 * @param string - The opinions it has from its string.
 * @param visit - The function, called with each key.
 */
function forEachKey(previousKeys: StylingOpinions | null, previousString: StylingOpinions | null, keys: StylingOpinions | null, string: StylingOpinions | null, visit: (key: string) => void): void {
  // The string first, so that an attribute written whole keeps the order of its classes
  const lists = [string, keys, previousString, previousKeys];
  for (let i = 0; i < lists.length; i++) {
    const list = lists[i];
    if (!list) {
      continue;
    }

    for (let j = 0; j < list.length; j += 2) {
      const key = list[j] as string;
      if (!isVisited(lists, i, j, key)) {
        visit(key);
      }
    }
  }
}

/**
 * Tells whether a key of a list of opinions was visited already, in that list or in one before it.
 *
 * @param lists - The lists.
 * @param list - The index of the list holding the key.
 * @param index - The index of the key in its list.
 * @param key - The key.
 * @returns `true` when the key comes earlier.
 */
function isVisited(lists: ReadonlyArray<StylingOpinions | null>, list: number, index: number, key: string): boolean {
  for (let i = 0; i <= list; i++) {
    const opinions = lists[i];
    const end = i === list ? index : opinions?.length ?? 0;
    for (let j = 0; j < end; j += 2) {
      if (opinions![j] === key) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Gives the keys a source makes present: the classes it adds, or the properties it sets.
 *
 * @param keys - Its opinions on the keys bound one by one.
 * @param string - Its opinions from its string.
 * @returns The keys, `null` for none.
 */
function presentKeys(keys: StylingOpinions | null, string: StylingOpinions | null): string | string[] | null {
  let present: string | string[] | null = null;
  forEachKey(null, null, keys, string, key => {
    const value = resolveOpinion(keys, string, key);
    if (value !== false && value !== undefined) {
      present = addKey(present, key);
    }
  });

  return present;
}

/**
 * Tells whether a key is among the keys the runtime wrote.
 *
 * @param written - The keys.
 * @param key - The key.
 * @returns `true` when the runtime wrote it.
 */
function isWritten(written: string | string[] | null, key: string): boolean {
  return Array.isArray(written) ? written.includes(key) : written === key;
}

/**
 * Adds a key to the keys the runtime wrote.
 *
 * @param written - The keys.
 * @param key - The key.
 * @returns The keys to store: the key alone, then an array of the exact length from the second one.
 */
function addKey(written: string | string[] | null, key: string): string | string[] {
  if (!written) {
    return key;
  }

  if (!Array.isArray(written)) {
    return [written, key];
  }

  written.push(key);
  return written;
}

/**
 * Removes a key from the keys the runtime wrote.
 *
 * @param written - The keys, holding the key.
 * @param key - The key.
 * @returns The keys to store: `null` for none, the key alone for one.
 */
function removeKey(written: string | string[] | null, key: string): string | string[] | null {
  if (!Array.isArray(written)) {
    return null;
  }

  written.splice(written.indexOf(key), 1);
  return written.length === 1 ? written[0] : written;
}
