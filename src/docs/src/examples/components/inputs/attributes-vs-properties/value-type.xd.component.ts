import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Shows the value of its input together with its type.
 */
@WebComponent({
  selector: 'ex-value-type',
  templateUrl: './value-type.xd.component.html'
})
export class ValueTypeComponent extends CustomElement {
  /**
   * Any value.
   */
  @Property(null)
  public accessor value!: InputSignal<unknown>;

  /**
   * The value as code, followed by its type.
   */
  public readonly description = computed(() => JSON.stringify(this.value()) + ' (' + typeof this.value() + ')');
}
