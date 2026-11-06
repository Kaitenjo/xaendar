/**
 * How the `@defer` blocks behave in the tests: `playthrough`, the default, as in the browser, their triggers firing and
 * their times passing, or `manual`, their triggers never firing, the test showing each part with the `render` of the
 * blocks `getDeferBlocks` finds.
 */
export type DeferBlockBehavior = 'playthrough' | 'manual';
