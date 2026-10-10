import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { translations } from '../core/i18n/i18n';
import { translate } from '../core/i18n/i18n.utils';

/**
 * Renders a text of the documentation, in the current language, as the content of its element.
 *
 * The texts are HTML (inline markup such as `<code>` and links), and text interpolation only ever
 * creates text nodes: the directive keeps the `innerHTML` of its element in sync with the
 * language instead. The texts come from the files of the site, never from the reader.
 *
 * @example
 * <p class="lead" @@i18n(key="pages.signals.computed.lead") />
 */
@Directive({
  selector: 'i18n'
})
export class I18nDirective extends CustomDirective<HTMLElement> {
  /**
   * The key of the text, its dot-separated path in the messages.
   */
  @Property.required()
  public accessor key!: InputSignal<string>;

  @Property()
  public accessor a!: InputSignal<string>;

  /**
   * Starts rendering the text: the properties already hold their bound values here.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.innerHTML = translate(translations(), this.key());
    });
  }
}
