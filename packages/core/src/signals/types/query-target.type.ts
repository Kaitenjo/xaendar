import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';

/**
 * What a query looks for in the Shadow DOM of a component: either a CSS selector
 * (a tag name such as `x-button`, a class such as `.card`, an attribute such as `[item]`,
 * or any combination of them), the class of a web component decorated
 * with `@WebComponent`, whose selector is matched, or the class of a custom directive, whose instances are found on
 * the elements it is applied to.
 */
export type QueryTarget = string | Constructor<HTMLElement> | Constructor<CustomDirective>;
