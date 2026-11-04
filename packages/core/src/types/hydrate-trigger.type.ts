/**
 * A trigger hydrating content rendered on the server: `load` as soon as the page is rendered, `idle` when the browser is
 * idle, `visible` when the content enters the viewport, `interaction` at the first event on it, `never` leaving it as
 * the HTML of the server for good.
 */
export type HydrateTrigger = 'load' | 'idle' | 'visible' | 'interaction' | 'never';
