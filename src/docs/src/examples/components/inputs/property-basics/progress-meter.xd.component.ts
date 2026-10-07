import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A progress meter configured by three inputs.
 */
@WebComponent({
  selector: 'ex-progress-meter',
  templateUrl: './progress-meter.xd.component.html',
  styleUrl: './progress-meter.css'
})
export class ProgressMeterComponent extends CustomElement {
  /**
   * The current value.
   */
  @Property(0)
  public accessor value!: InputSignal<number>;

  /**
   * The value of a full meter.
   */
  @Property(100)
  public accessor max!: InputSignal<number>;

  /**
   * Whether to show the figures. Bound as show-value: the alias is the name used in templates.
   */
  @Property(true, { alias: 'show-value' })
  public accessor showValue!: InputSignal<boolean>;

  /**
   * The value as a percentage of the maximum. Inputs are signals: computed signals can read them.
   */
  public readonly percent = computed(() => Math.round(this.value() / this.max() * 100));

  /**
   * The width of the filled part.
   */
  public readonly fillStyle = computed(() => 'width: ' + Math.min(100, this.percent()) + '%');
}
