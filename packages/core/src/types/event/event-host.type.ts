import type { StructuralDirective } from '../../models/structural-directive/structural-directive';
import type { BindingHost } from '../binding-host.type';

/**
 * A class able to declare outputs through `@Event`: any {@link BindingHost} but a structural directive,
 * which holds no element to dispatch the events on.
 */
export type EventHost = Exclude<BindingHost, StructuralDirective>;
