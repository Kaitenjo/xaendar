import { CustomDirective, Directive, HostAttribute, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { ElementStyles } from '../../types/element-styles.type';
import { toStyleString } from '../../utils/element-styles/element-styles.utils';

/**
 * Gives the element it is applied to the style properties of an object, the equivalent of `[ngStyle]` of Angular: the
 * keys are the properties, in kebab-case or in camelCase, followed by their unit, if any (`'width.px'`), or custom
 * properties (`'--accent'`), the values strings or numbers, with `!important` when they end with it; `null`,
 * `undefined` and `''` set nothing. When the object changes, the properties it no longer sets are removed.
 *
 * The properties are a source of the `style` of the element, merged property by property with the others, as
 * `@HostAttribute('style')` of a directive: the `style` and the `[style.name]` of the template win over it, it wins over
 * the component, and a property it does not set is left to them. On the server the properties are written into the
 * page. A value holding a `;` outside parentheses and quotes, which would write other properties, is left out.
 *
 * To set a few properties known in advance, `[style.name]="{…}"` of the template is lighter: `@@style` fits properties
 * computed, or many.
 *
 * @example
 * ```html
 * @import { StyleDirective } from '@xaendar/directives'
 *
 * <div @@style(value="{ ({ 'width.px': width(), backgroundColor: color(), '--accent': accent() }) }")>…</div>
 * <section @@style(value="{layout()}")>…</section>
 * ```
 */
@Directive({
  selector: 'style'
})
export class StyleDirective extends CustomDirective {
  /**
   * The style properties to set, by name, none by default.
   */
  @Property<InputSignal<ElementStyles>>(undefined)
  public accessor value!: InputSignal<ElementStyles>;

  /**
   * The `style` string the directive gives the element, read again whenever `value` changes.
   *
   * @returns The declarations of `value`, `undefined` for none.
   * @throws If a key of `value` is not a style property, followed by a unit of CSS if any, nor a custom property.
   */
  @HostAttribute('style')
  private get _styles(): string | undefined {
    return toStyleString(this.value());
  }
}
