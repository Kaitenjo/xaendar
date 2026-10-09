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
   * The value as a percentage of the maximum.
   */
  public readonly percent = computed(() => this._computePercent());
  /**
   * The width of the filled part.
   */
  public readonly fillStyle = computed(() => this._computeFillStyle());

  /**
   * Computes the value of `percent`.
   *
   * @returns The value as a percentage of the maximum. Inputs are signals: computed signals can read them.
   */
  private _computePercent(): number {
    return Math.round(this.value() / this.max() * 100);
  }

  /**
   * Computes the value of `fillStyle`.
   *
   * @returns The width of the filled part.
   */
  private _computeFillStyle(): string {
    return `width: ${Math.min(100, this.percent())}%`;
  }
}
