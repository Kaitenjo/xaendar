import type { TemplateExpression } from '../template-expression.type';

/**
 * A trigger watching elements written with arguments, as the compiler-generated render code describes it: the element
 * an element ref names, watched in place of the ones of the block (`hover(more)`), and the options of the observer of
 * `visible` (`visible({ rootMargin: '200px' })`). A constant of the module of the template, read once the template
 * holding the block is rendered, when the triggers are armed: its functions are the ones of the module, called with the
 * component and the context of the scope holding the block.
 */
export type ElementTrigger = {
  /**
   * The kind of the trigger.
   */
  readonly kind: 'visible' | 'interaction' | 'hover';
  /**
   * Reads the element to watch, once the template holding the block is rendered, if the trigger names one.
   */
  readonly target?: TemplateExpression<Element>;
  /**
   * The options of the `IntersectionObserver` of `visible`, if the trigger declares them: an object literal reading no
   * name, or the expression computing them, evaluated when the trigger is armed.
   */
  readonly options?: IntersectionObserverInit | TemplateExpression<IntersectionObserverInit>;
};
