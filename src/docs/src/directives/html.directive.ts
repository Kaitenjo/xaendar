import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Renders a text of the documentation already read in the current language, as the content of its element.
 *
 * Like `@@htmlTranslation`, for the texts that do not come from the messages of the site: the texts of the API
 * reference, loaded with their page. They are HTML (inline markup such as `<code>` and links) from the files of the
 * site, never from the reader.
 *
 * @example
 * <div \@\@html(content="{texts().description}") />
 */
@Directive({
  selector: 'html'
})
export class HtmlDirective extends CustomDirective<HTMLElement> {
  /**
   * The HTML to render.
   */
  @Property('')
  public accessor content!: InputSignal<string>;

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
    this.element.innerHTML = this.content();
  }
}
