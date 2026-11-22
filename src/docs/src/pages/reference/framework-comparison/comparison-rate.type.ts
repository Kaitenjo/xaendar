import type { ComparisonPage } from './comparison-page.type';

/**
 * The CPU throttling rates the pages were measured at, as the keys of their figures: the machine as it is, and four
 * times slower.
 */
export type ComparisonRate = Exclude<keyof ComparisonPage, 'scripts'>;
