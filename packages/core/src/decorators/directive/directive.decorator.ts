import { ClassDecorator, Constructor } from '@xaendar/types';
import { CustomDirective } from '../../models';
import { DirectiveOptions } from '../../types/directive/directive-options.type';

/**
 * Directive decorator that marks a class as a directive.
 * Directives are classes that extend the behavior and aspects of elements in the DOM.
 * @example
 * ```ts
 * @Directive({ selector: 'myDirective' })
 * class MyDirective extends CustomDirective {
 * 
 *  public readonly display = signal('block');
 * }
 * 
 * ```
 * 
 * ```html
 * <div @@myDirective(display="block") />
 * ```
 * @param _options The directive configuration, including the selector that identifies and applies it.
 */
export function Directive<T extends CustomDirective>(_options: DirectiveOptions): ClassDecorator<T> {
  return function (_klass: Constructor<T>, _context: ClassDecoratorContext<Constructor<T>>): void { };
}