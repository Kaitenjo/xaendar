import type { BaseTrigger } from './base-trigger.type';
import type { DeferTrigger } from './defer-trigger.type';

/**
 * A trigger of a `@hydrate`: the ones of a `@defer`, watching the content the server rendered, and `never`, leaving it as
 * the HTML of the server for good.
 */
export type HydrateTrigger = DeferTrigger | BaseTrigger<'never'>;
