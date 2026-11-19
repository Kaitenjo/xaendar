import type { HydrateTrigger } from '../hydrate-trigger.type';
import type { ElementTrigger } from './element-trigger.type';
import type { IdleTrigger } from './idle-trigger.type';
import type { TimerTrigger } from './timer-trigger.type';

/**
 * A trigger of a `@defer` or of a `@hydrate`, as the compiler-generated render code describes it: the name of a trigger
 * written without arguments, or the description of one written with arguments.
 */
export type Trigger = HydrateTrigger | IdleTrigger | TimerTrigger | ElementTrigger;
