import { stylePriority, styleValue } from '@xaendar/internals';
import type { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { ElementSources } from '../../types/element-sources.type';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import type { StylingOpinions } from '../../types/styling/styling-opinions.type';
import type { StylingSlot } from '../../types/styling/styling-slot.type';
import type { StylingState } from '../../types/styling/styling-state.type';
import type { StylingViews } from '../../types/styling/styling-views.type';
import type { TemplateStyling } from '../../types/styling/template-styling.type';
import { ensureElementSources, getElementSources } from '../element-sources/element-sources.util';
import { entrySize, findEntry, insertEntry, removeEntry, tierOf } from '../source-rank/source-rank.util';
import { hostKeys, hostString, templateKeys, templateString } from '../styling-opinions/styling-opinions.util';

/**
 * The ASCII whitespace separating the parts of a `part` attribute.
 */
const TOKEN_SEPARATOR = /[\t\n\f\r ]+/;

/**
 * Gives the state merging the sources of an attribute of an element, if two of them had an opinion on the same key.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns The state, `undefined` when the sources write the attribute directly.
 */
export function getStylingState(element: Element, attribute: StylingAttribute): StylingState | undefined {
  const slot = getElementSources(element)?.[attribute];
  return Array.isArray(slot) ? slot : undefined;
}

/**
 * Tells whether an element has a state merging the sources of an attribute: a helper of the tests, which check that an
 * element whose sources write different keys has none.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns `true` when the element has a state.
 */
export function _hasStylingState(element: Element, attribute: StylingAttribute): boolean {
  return !!getStylingState(element, attribute);
}

/**
 * Creates the state merging the sources of an attribute of an element, holding the ones that wrote it so far, directly:
 * the binding of the template the element keeps (see `StylingSlot`) and the host runs bound on it. The server creates it
 * before applying any source, since it applies them in an order that is not the one of the precedence.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns The state.
 */
export function createStylingState(element: Element, attribute: StylingAttribute): StylingState {
  const record = ensureElementSources(element);
  const slot = record[attribute];
  if (Array.isArray(slot)) {
    return slot;
  }

  let state: StylingState = [];
  const template = templateOf(slot);
  if (template) {
    state = insertEntry(state, 0, template, 0, slot === template ? undefined : (slot as TemplateStyling).values);
  }

  const { hosts } = record;
  if (Array.isArray(hosts)) {
    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[i] as HostStylingRun;
      if (host.attribute === attribute) {
        state = insertEntry(state, 0, host, host.rank, undefined);
      }
    }
  } else if ((hosts as HostStylingRun | null)?.attribute === attribute) {
    state = insertEntry(state, 0, hosts, (hosts as HostStylingRun).rank, undefined);
  }

  record[attribute] = state;
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
 * Marks an attribute of an element as one a host attribute may write: the binding of the template writing it keeps
 * itself in the sources of the element when it runs (see `StylingSlot`), so that a host attribute finds it.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 */
export function markStyling(element: Element, attribute: StylingAttribute): void {
  const record = ensureElementSources(element);
  record[attribute] ??= true;
}

/**
 * Keeps the binding of the template writing an attribute of an element in its sources, with the values its expressions
 * computed (see `StylingSlot`).
 *
 * @param record - The sources of the element, not merging the attribute in a state.
 * @param styling - The binding.
 * @param values - The values of its expressions.
 */
export function keepTemplateStyling(record: ElementSources, styling: _RenderStyling, values: unknown): void {
  const slot = record[styling.name];
  if (slot !== true && slot !== styling) {
    (slot as TemplateStyling).values = values;
  } else {
    record[styling.name] = values === undefined ? styling : { site: styling, values };
  }
}

/**
 * Gives the values the binding of the template kept in the sources of an element computed last.
 *
 * @param slot - What the element keeps of the sources of the attribute, holding the binding (see `StylingSlot`).
 * @returns The values, `undefined` when it computed none.
 */
export function keptValues(slot: TemplateStyling | _RenderStyling): unknown {
  return (slot as TemplateStyling).site ? (slot as TemplateStyling).values : undefined;
}

/**
 * Tells whether a change of the opinions of a source makes it share a key with another source of the attribute, which
 * writes it directly too: then the state merging them must be created. Only a key the source had no opinion on can be
 * shared, since sources writing directly have disjoint keys.
 *
 * @param record - The sources of the element.
 * @param attribute - The attribute.
 * @param owner - The source changing: the binding of the template, or a host run.
 * @param previousKeys - The opinions it had on the keys bound one by one.
 * @param previousString - The opinions it had from its string.
 * @param keys - The opinions it has on the keys bound one by one.
 * @param string - The opinions it has from its string.
 * @returns `true` when another source has an opinion on a key the source gets one on.
 */
export function sharesNewKey(record: ElementSources, attribute: StylingAttribute, owner: unknown, previousKeys: StylingOpinions | null, previousString: StylingOpinions | null, keys: StylingOpinions | null, string: StylingOpinions | null): boolean {
  const added = addedKeys(previousKeys, previousString, keys, string);
  if (!added) {
    return false;
  }

  const slot = record[attribute];
  const template = templateOf(slot);
  if (template && template !== owner) {
    const values = keptValues(slot as TemplateStyling | _RenderStyling);
    if (hasAnyKey(added, templateKeys(template, values), templateString(template, values))) {
      return true;
    }
  }

  const { hosts } = record;
  if (Array.isArray(hosts)) {
    for (let i = 0; i < hosts.length; i++) {
      if (sharesWithHost(hosts[i] as HostStylingRun, attribute, owner, added)) {
        return true;
      }
    }

    return false;
  }

  return !!hosts && sharesWithHost(hosts as HostStylingRun, attribute, owner, added);
}

/**
 * Sets the values of a source of the template in a state, registering it if it is not there yet, and writes again the
 * keys it had or has an opinion on, each with the value of the strongest source having one.
 *
 * @param element - The element.
 * @param record - The sources of the element, merging the attribute in a state.
 * @param styling - The binding of the template.
 * @param values - The values of its expressions.
 */
export function setTemplateStyling(element: Element, record: ElementSources, styling: _RenderStyling, values: unknown): void {
  const attribute = styling.name;
  let state = record[attribute] as StylingState;
  let index = findEntry(state, 0, styling);
  let previous: unknown = undefined;
  if (index === -1) {
    state = insertEntry(state, 0, styling, 0, values);
    record[attribute] = state;
    index = findEntry(state, 0, styling);
  } else {
    previous = state[index + 2];
    state[index + 2] = values;
  }

  applyChange(element, attribute, state, index, templateKeys(styling, previous), templateString(styling, previous), templateKeys(styling, values), templateString(styling, values));
}

/**
 * Writes the new values of a host run in a state, registering the run if it is not there yet, and writes again the keys
 * it had or has an opinion on, each with the value of the strongest source having one.
 *
 * @param element - The element.
 * @param record - The sources of the element, merging the attribute in a state.
 * @param run - The run, holding its new values.
 * @param previous - The values it held before, `undefined` before its first run.
 */
export function setHostStyling(element: Element, record: ElementSources, run: HostStylingRun, previous: unknown): void {
  const { attribute } = run;
  let state = record[attribute] as StylingState;
  let index = findEntry(state, 0, run);
  if (index === -1) {
    state = insertEntry(state, 0, run, run.rank, undefined);
    record[attribute] = state;
    index = findEntry(state, 0, run);
  }

  applyChange(element, attribute, state, index, hostKeys(run, previous), hostString(run, previous), hostKeys(run, run.values), hostString(run, run.values));
}

/**
 * Removes a source from the state of an attribute of an element, writing again the keys it had an opinion on: the value
 * of the next source having one comes back, and a key no source has an opinion on any more is removed, if the sources
 * made it present.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param owner - The owner of the source: the binding of the template, or a host run.
 */
export function removeStylingSource(element: Element, attribute: StylingAttribute, owner: unknown): void {
  const record = getElementSources(element)!;
  const state = record[attribute] as StylingState;
  const index = findEntry(state, 0, owner);
  if (index === -1) {
    return;
  }

  const rank = state[index + 1] as number;
  const keys = entrySize(rank) === 3 ? templateKeys(owner as _RenderStyling, state[index + 2]) : hostKeys(owner as HostStylingRun, (owner as HostStylingRun).values);
  const string = entrySize(rank) === 3 ? templateString(owner as _RenderStyling, state[index + 2]) : hostString(owner as HostStylingRun, (owner as HostStylingRun).values);
  applyChange(element, attribute, state, index, keys, string, null, null);
  record[attribute] = removeEntry(state, index);
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
      writeKey(element, attribute, key, value, isPresent(previous));
    }
  });
}

/**
 * Writes the whole attribute of an element not holding it yet, written by a single source: the classes present, or the
 * declarations, by the opinions of the source, the keys bound one by one winning over the string.
 *
 * N.B. A value holding a `;` is set alone with `setProperty`, after the attribute, as every later change sets it: a
 * value bound to a single key (`[style.color]="{ color }"`) may come from a user, and joined into the text of the
 * attribute it would end its declaration and add others (`red; position: fixed; inset: 0`), which `setProperty` rejects
 * along with the value. Do not write such a value into the text of the attribute.
 *
 * @param element - The element, without the attribute.
 * @param attribute - The attribute.
 * @param keys - The opinions of the source on the keys bound one by one.
 * @param string - The opinions of the source from its string.
 */
export function writeStylingAttribute(element: Element, attribute: StylingAttribute, keys: StylingOpinions | null, string: StylingOpinions | null): void {
  let text = '';
  // Keys and values set alone, rarely any
  let separate = null as string[] | null;
  forEachKey(null, null, keys, string, key => {
    const value = resolveOpinion(keys, string, key);
    if (value === true) {
      text = text ? `${text} ${key}` : key;
    } else if (typeof value === 'string') {
      if (value.includes(';')) {
        separate ? separate.push(key, value) : separate = [key, value];
      } else {
        text = text ? `${text} ${key}: ${value};` : `${key}: ${value};`;
      }
    }
  });

  if (text) {
    writeStylingText(element, attribute, text);
  }

  if (separate) {
    for (let i = 0; i < separate.length; i += 2) {
      writeKey(element, attribute, separate[i], separate[i + 1], false);
    }
  }
}

/**
 * Writes the whole text of the `class`, of the `part` or of the `style` of an element: the `class` and the `part`
 * attributes, and the inline style
 * through the CSSOM, which a `Content-Security-Policy` allows, while it blocks a `style` attribute written with
 * `setAttribute`, as one of the HTML.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param text - The text.
 */
export function writeStylingText(element: Element, attribute: StylingAttribute, text: string): void {
  // Every element a template renders, HTML, SVG or MathML, has the inline style of an HTMLElement
  attribute === 'style' ? (element as HTMLElement).style.cssText = text : element.setAttribute(attribute, text);
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
 * Gives the binding of the template an element keeps among the sources of an attribute (see `StylingSlot`).
 *
 * @param slot - What the element keeps.
 * @returns The binding, `undefined` when it keeps none.
 */
function templateOf(slot: StylingSlot | undefined): _RenderStyling | undefined {
  if (!slot || slot === true || Array.isArray(slot)) {
    return undefined;
  }

  return (slot as TemplateStyling).site ?? slot as _RenderStyling;
}

/**
 * Tells whether a host run of an attribute, other than a source, has an opinion on one of some keys.
 *
 * @param host - A host run of the element.
 * @param attribute - The attribute.
 * @param owner - The source, left out.
 * @param keys - The keys.
 * @returns `true` when the run has an opinion on one of them.
 */
function sharesWithHost(host: HostStylingRun, attribute: StylingAttribute, owner: unknown, keys: readonly string[]): boolean {
  return host !== owner && host.attribute === attribute && hasAnyKey(keys, hostKeys(host, host.values), hostString(host, host.values));
}

/**
 * Gives the keys a source gets an opinion on, which it had none on.
 *
 * @param previousKeys - The opinions it had on the keys bound one by one.
 * @param previousString - The opinions it had from its string.
 * @param keys - The opinions it has on the keys bound one by one.
 * @param string - The opinions it has from its string.
 * @returns The keys, `undefined` for none.
 */
function addedKeys(previousKeys: StylingOpinions | null, previousString: StylingOpinions | null, keys: StylingOpinions | null, string: StylingOpinions | null): string[] | undefined {
  let added: string[] | undefined;
  forEachKey(null, null, keys, string, key => {
    if (resolveOpinion(previousKeys, previousString, key) === undefined) {
      added ? added.push(key) : added = [key];
    }
  });

  return added;
}

/**
 * Tells whether a source has an opinion on one of some keys.
 *
 * @param keys - The keys.
 * @param opinions - The opinions of the source on the keys bound one by one.
 * @param string - The opinions of the source from its string.
 * @returns `true` when it has one.
 */
function hasAnyKey(keys: readonly string[], opinions: StylingOpinions | null, string: StylingOpinions | null): boolean {
  for (let i = 0; i < keys.length; i++) {
    if (resolveOpinion(opinions, string, keys[i]) !== undefined) {
      return true;
    }
  }

  return false;
}

/**
 * Writes again the keys a source of a state had or has an opinion on, each with the value of the strongest source having
 * one: a key no source has an opinion on any more is removed only when the sources made it present before the change,
 * so that a key written by other code stays.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param state - The state, holding the source.
 * @param index - The index of the source in the state.
 * @param previousKeys - The opinions the source had on the keys bound one by one.
 * @param previousString - The opinions the source had from its string.
 * @param keys - The opinions it has on the keys bound one by one.
 * @param string - The opinions it has from its string.
 */
function applyChange(element: Element, attribute: StylingAttribute, state: StylingState, index: number, previousKeys: StylingOpinions | null, previousString: StylingOpinions | null, keys: StylingOpinions | null, string: StylingOpinions | null): void {
  const views = viewsOf(state);
  // The source is the view of the same position, whose opinions are the ones before and after the change
  let position = 0;
  for (let i = 0; i < index; i += entrySize(state[i + 1] as number)) {
    position += 3;
  }

  forEachKey(previousKeys, previousString, keys, string, key => {
    const previous = resolveViews(views, position, previousKeys, previousString, key);
    writeKey(element, attribute, key, resolveViews(views, position, keys, string, key), isPresent(previous));
  });
}

/**
 * Computes the opinions of every source of a state (see `StylingViews`).
 *
 * @param state - The state.
 * @returns The opinions.
 */
function viewsOf(state: StylingState): StylingViews {
  let count = 0;
  for (let i = 0; i < state.length; i += entrySize(state[i + 1] as number)) {
    count++;
  }

  const views: StylingViews = new Array(count * 3);
  let position = 0;
  for (let i = 0; i < state.length; i += entrySize(state[i + 1] as number)) {
    const owner = state[i];
    const rank = state[i + 1] as number;
    views[position] = tierOf(rank);
    if (entrySize(rank) === 3) {
      views[position + 1] = templateKeys(owner as _RenderStyling, state[i + 2]);
      views[position + 2] = templateString(owner as _RenderStyling, state[i + 2]);
    } else {
      views[position + 1] = hostKeys(owner as HostStylingRun, (owner as HostStylingRun).values);
      views[position + 2] = hostString(owner as HostStylingRun, (owner as HostStylingRun).values);
    }

    position += 3;
  }

  return views;
}

/**
 * Gives the value of a key by the sources of a state: in each level, from the strongest, the keys bound one by one of
 * its sources, from the greatest order, then their strings. The source changing is read with the opinions given.
 *
 * @param views - The opinions of the sources (see `StylingViews`).
 * @param position - The position of the source changing among them.
 * @param keys - The opinions of the source changing on the keys bound one by one.
 * @param string - The opinions of the source changing from its string.
 * @param key - The key.
 * @returns The value, `undefined` when no source has an opinion on the key.
 */
function resolveViews(views: StylingViews, position: number, keys: StylingOpinions | null, string: StylingOpinions | null, key: string): string | boolean | undefined {
  let start = 0;
  while (start < views.length) {
    const tier = views[start];
    let end = start;
    while (end < views.length && views[end] === tier) {
      const value = findOpinion(end === position ? keys : views[end + 1] as StylingOpinions | null, key);
      if (value !== undefined) {
        return value;
      }

      end += 3;
    }

    for (let i = start; i < end; i += 3) {
      const value = findOpinion(i === position ? string : views[i + 2] as StylingOpinions | null, key);
      if (value !== undefined) {
        return value;
      }
    }

    start = end;
  }

  return undefined;
}

/**
 * Tells whether a value makes a key present: a class added, or a property set.
 *
 * @param value - The value, `undefined` for none.
 * @returns `true` when the key is present.
 */
function isPresent(value: string | boolean | undefined): boolean {
  return value !== undefined && value !== false;
}

/**
 * Writes a key of an element, only when the element does not hold the value already:
 * - a class or a part is added for `true` and removed for `false`, a property set to a string, with its priority;
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

  if (attribute === 'part') {
    writeToken(element, key, value === true, value === false || written);
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
 * Adds or removes a part of an element through the text of its `part` attribute, as `DOMTokenList` serializes it: the
 * parts joined by a single space, each one once. The text is written only when the part changes.
 *
 * N.B. Through the attribute, not `element.part`: the elements of the server, and of the DOM the tests run on, have no
 * `part` property, and the server must write the text the browser keeps when it hydrates. Do not switch to `part`.
 *
 * @param element - The element.
 * @param key - The part.
 * @param add - Whether the part is added.
 * @param remove - Whether the part is removed, when it is not added.
 */
function writeToken(element: Element, key: string, add: boolean, remove: boolean): void {
  const text = element.getAttribute('part');
  const tokens = text ? text.split(TOKEN_SEPARATOR).filter(Boolean) : [];
  const index = tokens.indexOf(key);
  if (add && index < 0) {
    tokens.push(key);
  } else if (!add && remove && index >= 0) {
    tokens.splice(index, 1);
  } else {
    return;
  }

  element.setAttribute('part', tokens.join(' '));
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
