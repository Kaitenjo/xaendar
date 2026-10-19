import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';

/**
 * What a query holds for each element it finds (see the `read` option of `@Query`): the element itself, `'element'`,
 * also when the target is the class of a directive, or the instance of a custom directive applied to it, by its class.
 */
export type QueryRead = 'element' | Constructor<CustomDirective>;
