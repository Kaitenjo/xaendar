import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { computed } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import type { ApiKind } from '../../pages/reference/api/api.data';

/**
 * The badge of the kind of a symbol of the API reference: its initial in a square of the color of the kind, followed
 * by its name when `labelled`.
 *
 * @example
 * <docs-api-kind kind="{symbol().kind}" labelled="{true}" />
 */
@WebComponent({
  selector: 'docs-api-kind',
  styleUrl: './docs-api-kind.xd.component.css',
  templateUrl: './docs-api-kind.xd.component.html'
})
export class DocsApiKindComponent extends CustomElement {
  /**
   * The kind of the symbol.
   */
  @Property<InputSignal<ApiKind>>('type')
  public accessor kind!: InputSignal<ApiKind>;
  /**
   * Whether the name of the kind follows its initial.
   */
  @Property(false)
  public accessor labelled!: InputSignal<boolean>;
  /**
   * The name of the kind, in the current language.
   */
  public readonly label = computed(() => this._computeLabel());
  /**
   * The initial shown for each kind, the same in every language.
   */
  public readonly initials: Readonly<Record<ApiKind, string>> = {
    decorator: 'D',
    class: 'C',
    function: 'F',
    type: 'T',
    global: 'G'
  };

  /**
   * Computes the value of `label`.
   *
   * @returns The name of the kind, in the current language.
   */
  private _computeLabel(): string {
    return translations().reference.kinds[this.kind()];
  }
}
