import type { SourceRank } from '../../types/source-rank.type';

/**
 * Inserts a source among the sources writing an attribute of an element, keeping them from the strongest: by level, then
 * from the greatest order. A source of the same rank as one already there goes after it.
 *
 * N.B. Deliberate, to save memory: a single source is kept as it is, and the second one makes an array of exactly two
 * items, since most attributes written by more than one source have two. Do not make the list an array always, nor
 * push the second source into an empty array, which would reserve room for many more.
 *
 * @template Source - The kind of source.
 * @param sources - The sources, from the strongest: one, an array from the second, `null` for none.
 * @param source - The source to insert.
 * @returns The sources to store.
 */
export function insertRanked<Source extends SourceRank>(sources: Source | Source[] | null, source: Source): Source | Source[] {
  if (!sources) {
    return source;
  }

  if (!Array.isArray(sources)) {
    return isStronger(source, sources) ? [source, sources] : [sources, source];
  }

  let index = 0;
  while (index < sources.length && !isStronger(source, sources[index])) {
    index++;
  }

  sources.splice(index, 0, source);
  return sources;
}

/**
 * Removes a source from the sources writing an attribute of an element.
 *
 * @template Source - The kind of source.
 * @param sources - The sources, holding the source.
 * @param source - The source to remove.
 * @returns The sources to store: `null` for none, the source left alone for one.
 */
export function removeRanked<Source extends SourceRank>(sources: Source | Source[] | null, source: Source): Source | Source[] | null {
  if (!Array.isArray(sources)) {
    return null;
  }

  sources.splice(sources.indexOf(source), 1);
  return sources.length === 1 ? sources[0] : sources;
}

/**
 * Tells whether a source wins over another one: of a lower level, or, in the same level, of a greater order.
 *
 * @param source - The source.
 * @param other - The other source.
 * @returns `true` when the source wins.
 */
function isStronger(source: SourceRank, other: SourceRank): boolean {
  return source.tier < other.tier || (source.tier === other.tier && source.order > other.order);
}
