import type { Function } from '@xaendar/types';
import type { Output } from '../../models/output/output';
import type { OutputDetail } from './output-detail.type';

/**
 * The listener of an output: it receives the event dispatched by the output, whose detail is the value the output emits.
 *
 * Any other member gets `unknown`, which leaves the type of a native event alone: TypeScript reads the type of the listener
 * of a name also from this side of `BindableEvents`, the native `click` included, even if it has no output with that name.
 *
 * @template Member - The member of the component or of the directive.
 */
export type OutputListener<Member> = Member extends Output<never> ? Function<[event: CustomEvent<OutputDetail<Member>>], unknown> : unknown;
