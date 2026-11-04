import type { NoArgsFunction } from '@xaendar/types';
import type { InputSignal } from '../../signals/types/input-signal.type';

/**
 * The getter of the value of an input.
 *
 * @template Input - The signal of the input.
 */
export type InputGetter<Input> = Input extends InputSignal<infer Value> ? NoArgsFunction<Value> : never;
