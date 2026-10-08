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
   * The language of the code. The union of {@link CodeLang} is written inline in the type of the
   * accessor because that type is copied as text in the type-check code of the templates binding
   * it, where an imported type alias would not be found.
   */
  @Property<InputSignal<CodeLang>>('ts')
  public accessor lang!: InputSignal<'ts' | 'html' | 'css' | 'json' | 'bash' | 'text'>;

  /**
   * Starts rendering the code: the properties already hold their bound values here.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.innerHTML = highlight(this.code(), this.lang());
    });
  }
}