/**
 * The sources writing the `class` or the `style` of an element, merged key by key: for each key the strongest source
 * having an opinion wins, the template over the directives over the component, and in each level the keys bound one by
 * one over the string. It exists only once two sources have had an opinion on the same key: sources whose keys are
 * disjoint write the element directly (see `applyDirectStyling`).
 *
 * The sources follow one another from the strongest (see `insertEntry` of `utils/source-rank`), each one as its owner
 * and its rank (see `toRank`), then, for a source of the template, the values of its expressions:
 * - a source of the template is `[binding, rank, values]`: the binding is the constant of the module describing it (see
 *   `_RenderStyling`), shared by every element, and the values are the ones its expressions computed last, the same
 *   value the binding keeps in its slot, from which its opinions are computed when they are needed;
 * - a host run is `[run, rank]`: the run keeps the values of its host attributes itself (see `HostStylingRun.values`).
 *
 * The keys the runtime wrote, which alone are removed when no source has an opinion on them any more, are the ones the
 * sources made present before the change: the state does not list them.
 *
 * N.B. Deliberate, to save memory: one array of the exact length, with no object per source and no parsed opinion (the
 * opinions of a string are tokens copied from it, which a large table would keep for every row), nor the list of the
 * keys written, which is the resolution of the sources before the change. Do not keep an object per source, the
 * opinions of the sources or the keys written again.
 */
export type StylingState = unknown[];
