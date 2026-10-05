import type { Constructor } from '@xaendar/types';

/**
 * What a query looks for in the Shadow DOM of a component: either a CSS selector
 * (a tag name such as `x-button`, a class such as `.card`, an attribute such as `[item]`,
 * or any combination of them), or the class of a web component decorated
 * with `@WebComponent`, whose selector is matched.
 */
export type QueryTarget = string | Constructor<HTMLElement>;
