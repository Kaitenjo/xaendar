import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { lang } from '../core/router/router';

/**
 * Renders its element only while the documentation is read in the given language.
 *
 * @example
 * <page-overview-it *lang(code="it") />
 */
@Directive({
  selector: 'lang'
})
export class LangDirective extends StructuralDirective {
  /**
   * The language the element is written in.
   */
  @Property.required()
  public accessor code!: InputSignal<string>;

  /**
   * Tells whether the element is in the current language.
   *
   * @returns `true` if the element has to be rendered.
   */
  public shouldRender(): boolean {
    return lang() === this.code();
  }
}
