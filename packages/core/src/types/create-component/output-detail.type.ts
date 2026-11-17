import type { Output } from '../../models/output/output';

/**
 * The detail of the events dispatched by an output: the value it dispatches, `void` for an output dispatching none.
 *
 * @template Emitter - The output dispatching the events.
 */
export type OutputDetail<Emitter> = Emitter extends Output<infer Value> ? Value : void;
