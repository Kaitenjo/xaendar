/**
 * The attribute of an element listening to `submit` in its template, the same as the `_SUBMIT_ATTRIBUTE` of
 * `@xaendar/core`: the event contract prevents the submission of a form it holds before the hydration.
 */
export const SUBMIT_ATTRIBUTE = 'data-xd-submit';

/**
 * The text of the comments the code rendering on the server writes around the dynamic parts of the HTML, the same as the
 * `_SSR_MARKERS` of `@xaendar/core`, whose runtime adopts the nodes by them: this package depends on no runtime, and
 * writes them as string literals into the code it generates. Each block is opened by `<!--marker-->`
 * (`<!--marker:detail-->` with its detail) and closed by `<!--/marker-->`.
 */
export const SSR_MARKERS = {
  /**
   * Written before each interpolation, and between two texts following each other: `<!---->`.
   */
  text: '',
  /**
   * An `@if`, its detail the index of the branch rendered: `<!--xd-if:0-->…<!--/xd-if-->`.
   */
  if: 'xd-if',
  /**
   * A `@switch`, its detail the position of the block rendered: `<!--xd-switch:1-->…<!--/xd-switch-->`.
   */
  switch: 'xd-switch',
  /**
   * A `@for`, opening its items, each one opened by the marker of its key, which the runtime writes:
   * `<!--xd-for-->…<!--/xd-for-->`.
   */
  for: 'xd-for',
  /**
   * The content of a `@hydrate`, which the browser adopts once a trigger fires: `<!--xd-h-->…<!--/xd-h-->`.
   */
  hydrate: 'xd-h',
  /**
   * A `@client`, holding its `@placeholder`, if any, which the browser replaces with the content of the block:
   * `<!--xd-c-->…<!--/xd-c-->`.
   */
  client: 'xd-c'
} as const;
