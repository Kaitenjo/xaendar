import type { StructuralDirective } from '../../models/structural-directive/structural-directive';
import type { BindingHost } from '../binding-host.type';

/**
 * A class able to declare outputs through `@Event`, and to bind its host element through `@HostProperty` and
 * `@HostEvent`: any {@link BindingHost} but a structural directive, which holds no element.
 */
export type EventHost = Exclude<BindingHost, StructuralDirective>;
