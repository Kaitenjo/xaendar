import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { computed } from '@xaendar/core/signals';

/**
 * A meter whose inputs the attributes of its element write, as on a native element, in any HTML.
 */
@WebComponent({
  selector: 'ex-meter',
  styleUrl: './meter.css',
  templateUrl: './meter.xd.component.html'
})
export class MeterComponent extends CustomElement {
  /**
   * Written by the value attribute, converted with Number(), the type of its default value.
   */
  @Property(0, { attribute: true })
  public accessor value!: InputSignal<number>;
  /**
   * Written by the compact attribute, true while it is present, and reflected on it.
   */
  @Property(false, { attribute: true, reflect: true })
  public accessor compact!: InputSignal<boolean>;
  /**
   * The value with its type, and whether the meter is compact.
   */
  public readonly label = computed(() => this._computeLabel());

  /**
   * Computes the value of `label`.
   *
   * @returns The value with its type, and whether the meter is compact.
   */
  private _computeLabel(): string {
    return `${this.value()} (${typeof this.value()})${this.compact() ? ', compact' : ''}`;
  }
}
