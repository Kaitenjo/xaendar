// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import { addHostRun, ensureElementSources, getElementSources, getHostRuns, removeHostRun } from './element-sources.util';

/**
 * Creates a run of host attributes on an element.
 */
const runOf = (element: Element) => new HostAttributeRun({} as never, element, [{ name: 'id', kind: 'attribute', read: () => 'a' }], 0x10000);

describe('element sources', () => {
  it('keeps nothing for an element without sources, and a single host run as it is', () => {
    const element = document.createElement('div');
    expect(getElementSources(element)).toBeUndefined();
    expect(getHostRuns(element)).toBeNull();

    const run = runOf(element);
    addHostRun(run);
    expect(getElementSources(element)).toBeUndefined();
    expect(getHostRuns(element)).toBe(run);

    removeHostRun(run);
    expect(getHostRuns(element)).toBeNull();
  });

  it('creates the record holding the run kept alone, once', () => {
    const element = document.createElement('div');
    const run = runOf(element);
    addHostRun(run);
    const record = ensureElementSources(element);
    expect(record).toEqual({ class: null, style: null, attributes: null, hosts: run, template: null });
    expect(ensureElementSources(element)).toBe(record);
    expect(getElementSources(element)).toBe(record);
    expect(ensureElementSources(document.createElement('div')).hosts).toBeNull();
  });

  it('keeps the runs of a record alone, then in an array of the exact length', () => {
    const element = document.createElement('div');
    const record = ensureElementSources(element);
    const runs = [runOf(element), runOf(element), runOf(element)];
    addHostRun(runs[0]);
    expect(record.hosts).toBe(runs[0]);

    addHostRun(runs[1]);
    addHostRun(runs[2]);
    expect(getHostRuns(element)).toEqual(runs);

    removeHostRun(runs[1]);
    expect(record.hosts).toEqual([runs[0], runs[2]]);
    removeHostRun(runs[0]);
    expect(record.hosts).toBe(runs[2]);
    removeHostRun(runs[2]);
    expect(record.hosts).toBeNull();

    // A second run makes the record of an element holding one alone
    const other = document.createElement('div');
    addHostRun(runOf(other));
    addHostRun(runOf(other));
    expect(getElementSources(other)?.hosts).toHaveLength(2);
    removeHostRun((getHostRuns(other) as HostAttributeRun[])[1]);
    expect(getHostRuns(other)).toBeInstanceOf(HostAttributeRun);
  });
});
