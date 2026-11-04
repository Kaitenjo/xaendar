import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { highlight } from '../core/highlight/highlight';
import type { CodeLang } from '../core/highlight/highlight';

/**
 * Renders highlighted code inside its element.
 *
 * Text interpolation only ever creates text nodes, so markup has to be set imperatively: the
 * directive keeps the `innerHTML` of its element in sync with its properties.
 *
 * @example
 * <code @@highlight(code="{source()}" lang="ts") />
 */
@Directive({
  selector: 'highlight'
})
export class HighlightDirective extends CustomDirective<HTMLElement> {
  /**
   * The code to highlight.
   */
  @Property('')
  public accessor code!: InputSignal<string>;
  /**
   * The language of the code.
   */
  @Property<InputSignal<CodeLang>>('ts')
  public accessor lang!: InputSignal<CodeLang>;

  /**
   * Starts rendering the code: the properties already hold their bound values here.
   * On the server, where the effects do not run, the code is written once, into the HTML of the page; in the browser the
   * effect writes it, and again at each change.
   */
  public onInit(): void {
    if (typeof window === 'undefined') {
      this._render();
    }

    this.effect(() => this._render());
  }

  /**
   * Writes the code into the element.
   */
  private _render(): void {
    this.element.innerHTML = highlight(this.code(), this.lang());
  }
}