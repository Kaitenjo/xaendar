import type { NoArgsFunction } from '@xaendar/types';
import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The getter of the value of an input: the value it accepts from outside, which its `transform` takes.
 *
 * @template Input - The signal of the input.
 */
export type InputGetter<Input> = Input extends InputSignal<unknown, infer IncomingValue> ? NoArgsFunction<IncomingValue> : never;
