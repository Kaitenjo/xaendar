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
   */
  public onInit(): void {
    this.effect(() => {
      this.element.innerHTML = this.content();
    });
  }
}
