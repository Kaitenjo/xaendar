import type { WhenTrigger } from './when-trigger.type';

/**
 * The options of the `IntersectionObserver` of a `visible` trigger, written as an object literal:
 * `{ rootMargin: '200px' }` in `visible({ rootMargin: '200px' })`. Its span is the one of the object.
 */
export type TriggerOptions = Pick<WhenTrigger, 'expression' | 'expressionNode' | 'span'>;
