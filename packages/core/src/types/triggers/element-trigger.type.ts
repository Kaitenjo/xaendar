import type { NoArgsFunction } from '@xaendar/types';

/**
 * A trigger watching elements written with arguments, as the compiler-generated render code describes it: the element
 * an element ref names, watched in place of the ones of the block (`hover(more)`), and the options of the observer of
 * `visible` (`visible({ rootMargin: '200px' })`).
 */
export type ElementTrigger = {
  /**
   * The kind of the trigger.
   */
  readonly kind: 'visible' | 'interaction' | 'hover';
  /**
   * Reads the element to watch, once the template holding the block is rendered, if the trigger names one.
   */
  readonly target?: NoArgsFunction<Element>;
  /**
   * The options of the `IntersectionObserver` of `visible`, if the trigger declares them.
   */
  readonly options?: IntersectionObserverInit;
};
