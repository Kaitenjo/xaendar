/**
 * A block of a template (`@if`, `@switch`, `@for`, `@hydrate`, `@client`, an element structural directives are applied
 * to), as a node strategy opens it: its anchor, and what the server rendered in it.
 */
export type NodeBlock = {
  /**
   * The comment the content of the block is inserted before: created, or the marker closing the block the server
   * rendered, which takes its place.
   */
  readonly anchor: Comment;
  /**
   * The detail of the marker opening the block the server rendered (`0` for `<!--xd-if:0-->`, an empty string for
   * `<!--xd-if-->`), `undefined` when the block is created.
   */
  readonly marker: string | undefined;
};
