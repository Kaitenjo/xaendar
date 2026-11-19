import { CustomElement, Property, Query, WebComponent } from '@xaendar/core';
import type { TemplateRef } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal, QuerySignal } from '@xaendar/core/signals';

/**
 * A list of options, one selectable, which renders each option with the template `option` passed to it as content, and
 * the template of its input `emptyTemplate` when there is none.
 */
@WebComponent({
  selector: 'ex-option-list',
  styleUrl: './option-list.css',
  templateUrl: './option-list.xd.component.html'
})
export class OptionListComponent extends CustomElement {
  /**
   * The options to list.
   */
  @Property<InputSignal<string[]>>([])
  public accessor options!: InputSignal<string[]>;
  /**
   * The template rendered when there are no options, if any.
   */
  @Property<InputSignal<TemplateRef<[]> | null>>(null)
  public accessor emptyTemplate!: InputSignal<TemplateRef<[]> | null>;
  /**
   * The template rendering an option, passed as content: it receives the option and whether it is the selected one.
   */
  @Query.contentTemplateRequired<[option: string, selected: boolean]>('option')
  public accessor option!: QuerySignal<TemplateRef<[option: string, selected: boolean]>>;
  /**
   * The option selected, if any.
   */
  public readonly selected = signal<string | null>(null);

  /**
   * Selects an option.
   *
   * @param option - The option.
   */
  public select(option: string): void {
    this.selected.set(option);
  }
}
