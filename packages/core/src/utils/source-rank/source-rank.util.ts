import type { StylingTier } from '../../types/styling/styling-tier.type';

/**
 * The rank of the first source of a level after the template (see {@link toRank}): a rank below it is the one of a source
 * of the template.
 */
const TIER = 0x10000;

/**
 * Gives the rank of a source writing an attribute of an element among the other sources writing it (see `StylingState`
 * and `AttributeState`): its level, from the strongest (see `StylingTier`), times 65536, plus its order in the level, of
 * two directives the one with the greater order winning. The order of a directive is its index among the directives of
 * its element (see `DIRECTIVE_ORDER`), far below 65536.
 *
 * N.B. Deliberate, to save memory: the level and the order in one small integer, kept in the state next to the source,
 * instead of an object holding both. Do not split it again.
 *
 * @param tier - The level of the source.
 * @param order - The order of the source in its level.
 * @returns The rank.
 */
export function toRank(tier: StylingTier, order: number): number {
  return tier * TIER + order;
}

/**
 * Gives the index of the source an owner registered in a state.
 *
 * @param state - The state: its first sources start at `start`.
 * @param start - The index of the first source.
 * @param owner - The owner of the source.
 * @returns The index of its owner, `-1` when the owner registered none.
 */
export function findEntry(state: readonly unknown[], start: number, owner: unknown): number {
  for (let i = start; i < state.length; i += entrySize(state[i + 1] as number)) {
    if (state[i] === owner) {
      return i;
    }
  }

  return -1;
}

/**
 * Inserts a source in a state, keeping the sources from the strongest: by level, then from the greatest order. A source
 * of the same rank as one already there goes after it. A source of the template is followed by its data, a host run
 * keeps its own.
 *
 * N.B. Deliberate, to save memory: the state is copied into an array of the exact length, which a source registers in
 * rarely, instead of growing it with `splice`, which would reserve room for many more items. Do not grow it in place.
 *
 * @param state - The state: its first sources start at `start`.
 * @param start - The index of the first source.
 * @param owner - The owner of the source.
 * @param rank - The rank of the source (see {@link toRank}).
 * @param data - The data of a source of the template, ignored for a host run.
 * @returns The new state.
 */
export function insertEntry(state: readonly unknown[], start: number, owner: unknown, rank: number, data: unknown): unknown[] {
  let index = start;
  while (index < state.length && !isStronger(rank, state[index + 1] as number)) {
    index += entrySize(state[index + 1] as number);
  }

  const size = entrySize(rank);
  const inserted = new Array<unknown>(state.length + size);
  for (let i = 0; i < index; i++) {
    inserted[i] = state[i];
  }

  inserted[index] = owner;
  inserted[index + 1] = rank;
  if (size === 3) {
    inserted[index + 2] = data;
  }

  for (let i = index; i < state.length; i++) {
    inserted[i + size] = state[i];
  }

  return inserted;
}

/**
 * Removes a source from a state.
 *
 * @param state - The state.
 * @param index - The index of the owner of the source (see {@link findEntry}).
 * @returns The new state, an array of the exact length.
 */
export function removeEntry(state: readonly unknown[], index: number): unknown[] {
  const size = entrySize(state[index + 1] as number);
  const removed = new Array<unknown>(state.length - size);
  for (let i = 0; i < index; i++) {
    removed[i] = state[i];
  }

  for (let i = index + size; i < state.length; i++) {
    removed[i - size] = state[i];
  }

  return removed;
}

/**
 * Gives the number of items a source takes in a state: its owner, its rank and, for a source of the template, its data.
 *
 * @param rank - The rank of the source.
 * @returns The number of items.
 */
export function entrySize(rank: number): number {
  return rank < TIER ? 3 : 2;
}

/**
 * Tells the level of a source by its rank.
 *
 * @param rank - The rank.
 * @returns The level.
 */
export function tierOf(rank: number): number {
  return Math.floor(rank / TIER);
}

/**
 * Tells whether a source wins over another one: of a lower level, or, in the same level, of a greater order.
 *
 * @param rank - The rank of the source.
 * @param other - The rank of the other source.
 * @returns `true` when the source wins.
 */
function isStronger(rank: number, other: number): boolean {
  const tier = tierOf(rank);
  const otherTier = tierOf(other);
  return tier < otherTier || (tier === otherTier && rank > other);
}
