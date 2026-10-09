import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';

/**
 * Kinds of callout.
 */
export type CalloutKind = keyof Messages['callout'];

/**
 * A highlighted aside: a note, a tip, a warning, an edge case, something not supported or a known issue.
 * Its content is projected in its default slot.
 */
@WebComponent({
  selector: 'docs-callout',
  templateUrl: './docs-callout.xd.component.html',
  styleUrl: './docs-callout.xd.component.css'
})
export class DocsCalloutComponent extends CustomElement {
  /**
   * The kind of callout, one of {@link CalloutKind}. Typed as a string so that it can be bound
   * statically (`kind="tip"`): static values are type-checked as strings.
   */
  @Property('note')
  public accessor kind!: InputSignal<string>;
  /**
   * An optional title, shown after the label of the kind.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
  /**
   * The texts of the user interface.
   */
  public readonly t = t;
  /**
   * The label of the kind.
   */
  public readonly label = computed(() => this._computeLabel());

  /**
   * Computes the value of `label`.
   *
   * @returns The label of the kind.
   */
  private _computeLabel(): string {
    return this.t().callout[this.kind() as CalloutKind] ?? this.kind();
  }
}
