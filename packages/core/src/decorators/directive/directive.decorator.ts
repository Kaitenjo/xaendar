import { ClassDecorator, Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { DirectiveOptions } from '../../types/directive/directive-options.type';
import { _defineDirective } from '../../utils/directive-registry/directive-registry.util';

/**
 * Directive decorator that marks a class as a directive.
 * Directives are classes that extend the behavior and aspects of elements in the DOM:
 * a custom directive (extending `CustomDirective`) acts on the element it is applied to,
 * a structural directive (extending `StructuralDirective`) decides whether the element is rendered at all.
 *
 * Registers the directive under its selector, so the template runtime can
 * instantiate it on every element it is applied to.
 * @example
 * ```ts
 * @Directive({ selector: 'myDirective' })
 * class MyDirective extends CustomDirective {
 *
 *  @Property('block')
 *  public accessor display!: InputSignal<string>;
 * }
 *
 * ```
 *
 * ```html
 * <div @@myDirective(display="block") />
 * ```
 * @param options The directive configuration, including the selector that identifies and applies it.
 */
export function Directive<T extends CustomDirective | StructuralDirective>(options: DirectiveOptions): ClassDecorator<T> {
  return function (klass: Constructor<T>, _context: ClassDecoratorContext<Constructor<T>>): void {
    _defineDirective(options.selector, klass);
  };
}
