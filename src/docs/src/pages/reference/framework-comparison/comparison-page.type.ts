import type results from './framework-comparison.results.json';

/**
 * The figures measured on one page of the comparison, as `comparison/measure.mjs` writes them: the size of its
 * JavaScript, then the medians of the runs at each CPU throttling rate.
 */
export type ComparisonPage = typeof results.pages.xaendar;
