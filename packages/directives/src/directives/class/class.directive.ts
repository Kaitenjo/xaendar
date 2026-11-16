import { CustomDirective, Directive, HostAttribute, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { ElementClasses } from '../../types/element-classes.type';
import { toClassString } from '../../utils/element-classes/element-classes.utils';

/**
 * Gives the element it is applied to the classes of an expression, the equivalent of `[ngClass]` of Angular: a string,
 * a list or a set of classes, or an object whose keys are classes, each given while its value is truthy. When the
 * value changes, the classes it no longer holds are removed, the new ones added.
 *
 * The classes are a source of the `class` of the element, merged class by class with the others, as `@HostAttribute('class')`
 * of a directive: the `class` and the `class.name` of the template win over it, it wins over the component, and a class
 * it does not give, or gives no more, is left to them. On the server the classes are written into the page.
 *
 * To toggle a few classes known in advance, `class.name="{…}"` of the template is lighter: `@@class` fits classes
 * computed, or many.
 *
 * @example
 * ```html
 * @import { ClassDirective } from '@xaendar/directives'
 *
 * <li @@class(value="{ ({ active: item.id === selected(), done: item.done }) }")>{ item.name }</li>
 * <div class="card" @@class(value="{theme().classes}")>…</div>
 * ```
 */
@Directive({
  selector: 'class'
})
export class ClassDirective extends CustomDirective {
  /**
   * The classes to give: a string, a list, a set, or an object of classes and conditions, none by default.
   */
  @Property<InputSignal<ElementClasses>>(undefined)
  public accessor value!: InputSignal<ElementClasses>;

  /**
   * The `class` string the directive gives the element, read again whenever `value` changes.
   *
   * @returns The classes of `value`, separated by spaces, `undefined` for none.
   */
  @HostAttribute('class')
  private get _classes(): string | undefined {
    return toClassString(this.value());
  }
}
