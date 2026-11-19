import type { BaseTrigger } from './base-trigger.type';
import type { ElementTrigger } from './element-trigger.type';
import type { IdleTrigger } from './idle-trigger.type';
import type { TimerTrigger } from './timer-trigger.type';
import type { VisibleTrigger } from './visible-trigger.type';
import type { WhenTrigger } from './when-trigger.type';

/**
 * A trigger of a `@defer`, and of a `@hydrate`: `load` as soon as the page is rendered, `idle` when the browser is idle,
 * `timer` once a time has passed, `visible` when the elements it watches enter the viewport, `interaction` at the first
 * event on them, `hover` when the pointer moves over them or the focus enters them, `when` once an expression is truthy.
 */
export type DeferTrigger = BaseTrigger<'load'> | IdleTrigger | TimerTrigger | VisibleTrigger | ElementTrigger | WhenTrigger;
