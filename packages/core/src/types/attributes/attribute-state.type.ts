/**
 * The sources writing an attribute of an element, other than `class` and `style`, merged as a whole: the strongest source
 * with an opinion wins, the template over the directives over the component, and the directive with the greater order in
 * its level. It exists only for an attribute two levels write: an attribute written by one level is written directly
 * (see `writeAttribute`).
 *
 * The name of the attribute comes first, then the sources from the strongest (see `insertEntry` of `utils/source-rank`),
 * each one as its owner and its rank (see `toRank`):
 * - a source of the template is `[attribute, rank, value]`: the constant of the attribute in the module of the template
 *   and the value it bound, `null` and `undefined` having no opinion;
 * - a host run is `[run, rank]`: the run keeps the value of its host attribute itself (see `HostAttributeRun.values`).
 *
 * The runtime wrote the attribute the element holds when the sources gave it a text before the change: only then it is
 * removed when no source has an opinion on it any more, so that a value written by other code stays.
 *
 * N.B. Deliberate, to save memory: one array of the exact length, with no object per source, and an element keeps the
 * states of its attributes among its sources (see `ElementSources.attributes`). Do not keep an object per source again.
 */
export type AttributeState = unknown[];
