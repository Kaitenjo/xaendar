import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { translations } from '../core/i18n/i18n';
import { translate } from '../core/i18n/i18n.utils';

/**
 * Renders a text of the documentation holding HTML, in the current language, as the content of its element.
 *
 * The texts with inline markup (`<code>`, links) or entities would show them as they are in an interpolation, which
 * only ever creates text nodes: the directive keeps the `innerHTML` of its element in sync with the language instead.
 * A plain text is an interpolation: `{ t(translations(), 'pages.signals.computed.title') }`. The texts come from the
 * files of the site, never from the reader.
 *
 * @example
 * <p \@\@htmlTranslation(key="pages.signals.computed.lead") class="lead" />
 */
@Directive({
  selector: 'htmlTranslation'
})
export class HtmlTranslationDirective extends CustomDirective<HTMLElement> {
  /**
   * The key of the text, its dot-separated path in the messages.
   */
  @Property.required()
  public accessor key!: InputSignal<string>;

  /**
   * Starts rendering the text: the properties already hold their bound values here.
   * On the server, where the effects do not run, the text is written once, into the HTML of the page; in the browser the
   * effect writes it, and again at each change.
   */
  public onInit(): void {
    if (typeof window === 'undefined') {
      this._render();
    }

    this.effect(() => this._render());
  }

  /**
   * Writes the text into the element.
   */
  private _render(): void {
    this.element.innerHTML = translate(translations(), this.key());
  }
}
