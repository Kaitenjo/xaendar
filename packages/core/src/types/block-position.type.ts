/**
 * Where a block of a template (`@if`, `@switch`, `@for`, `@try`, `@defer`, `@hydrate`, an element structural directives
 * are applied to) is rendered among the nodes of its parent, as the compiler finds it: a member of the constant of the
 * module describing the block.
 *
 * N.B. Deliberate, to save memory: the last block of an element, of a shadow root, or of the content of a block itself
 * the last one, has no anchor, a `Comment` and its object per instance of the block, which a block in every cell of a
 * table would pay ten thousand times: what it renders is appended to its parent, nothing following it there. The
 * server writes no marker closing it. Do not create an anchor for it, nor compute the position at runtime: only the
 * compiler sees the siblings of the block, and the server must write the same markers the client adopts.
 */
export type BlockPosition = {
  /**
   * Whether the block is the last node of its parent: the end of the parent is where it renders, without an anchor.
   * Left out when it is not.
   */
  readonly last?: true;
  /**
   * The slot of the anchor of the block in the scope rendering it (see `_Context`), given by the compiler to the blocks
   * at the top of the block of a scope that have an anchor: left out for the others, whose anchor no scope tracks.
   */
  readonly slot?: number;
  /**
   * The index of the container of the block among the containers of the scope rendering it (see `_ScopeLayout`), which
   * holds what the block shows: left out for the first one.
   */
  readonly container?: number;
};
