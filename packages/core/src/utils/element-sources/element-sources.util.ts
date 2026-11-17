import type { ElementSources } from '../../types/element-sources.type';
import type { HostRun } from '../../types/host/host-run.type';

/**
 * What each element keeps of the sources writing its attributes: its record (see `ElementSources`), or, for an element
 * holding a single host run and nothing else, the run itself.
 *
 * N.B. Deliberate, to save memory and reads: a single `WeakMap` for every kind of state, instead of a symbol property on
 * the element, which costs more per element (a property array, against an entry of the table) and gives the elements
 * and the components a hidden class of their own; an element without sources, nearly every one, costs one read. A
 * single host run is kept without a record. Do not add a map per kind of state, nor a property on the element.
 */
const elementSources = new WeakMap<Element, ElementSources | HostRun>();

/**
 * Gives the record of the sources of an element.
 *
 * @param element - The element.
 * @returns The record, `undefined` when the element has none, or holds a single host run alone.
 */
export function getElementSources(element: Element): ElementSources | undefined {
  const sources = elementSources.get(element);
  return sources && isRecord(sources) ? sources : undefined;
}

/**
 * Gives the record of the sources of an element, creating it when there is none, holding the host run the element kept
 * alone, if any.
 *
 * @param element - The element.
 * @returns The record.
 */
export function ensureElementSources(element: Element): ElementSources {
  const sources = elementSources.get(element);
  if (sources && isRecord(sources)) {
    return sources;
  }

  const record: ElementSources = { class: null, style: null, attributes: null, hosts: sources ?? null, template: null };
  elementSources.set(element, record);
  return record;
}

/**
 * Gives the host runs bound on an element.
 *
 * @param element - The element.
 * @returns The runs: one, or an array from the second, `null` for none.
 */
export function getHostRuns(element: Element): HostRun | HostRun[] | null {
  const sources = elementSources.get(element);
  if (!sources) {
    return null;
  }

  return isRecord(sources) ? sources.hosts : sources;
}

/**
 * Registers a host run bound on its element, so that a state created later finds it: kept alone by an element without
 * record, otherwise among the runs of its record.
 *
 * @param run - The run.
 */
export function addHostRun(run: HostRun): void {
  const { element } = run;
  const sources = elementSources.get(element);
  if (!sources) {
    elementSources.set(element, run);
    return;
  }

  const record = isRecord(sources) ? sources : ensureElementSources(element);
  const { hosts } = record;
  if (!hosts) {
    record.hosts = run;
  } else {
    record.hosts = Array.isArray(hosts) ? hosts.concat(run) : [hosts, run];
  }
}

/**
 * Unregisters a host run of its element.
 *
 * @param run - The run, registered.
 */
export function removeHostRun(run: HostRun): void {
  const { element } = run;
  const sources = elementSources.get(element);
  if (sources === run) {
    elementSources.delete(element);
    return;
  }

  const record = sources as ElementSources;
  const { hosts } = record;
  if (!Array.isArray(hosts)) {
    record.hosts = null;
  } else if (hosts.length === 2) {
    record.hosts = hosts[0] === run ? hosts[1] : hosts[0];
  } else {
    record.hosts = hosts.filter(host => host !== run).slice();
  }
}

/**
 * Tells whether what an element keeps is its record, not a host run alone: a record always holds `hosts`.
 *
 * @param sources - What the element keeps.
 * @returns `true` for a record.
 */
function isRecord(sources: ElementSources | HostRun): sources is ElementSources {
  return (sources as ElementSources).hosts !== undefined;
}
