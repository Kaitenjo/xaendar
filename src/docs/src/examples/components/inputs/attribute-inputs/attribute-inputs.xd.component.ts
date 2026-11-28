import { CustomElement, Query, WebComponent } from '@xaendar/core';
import type { QuerySignal } from '@xaendar/core/signals';
import { signal } from '@xaendar/core/signals';
import { MeterComponent } from './meter.xd.component';

/**
 * Renders a meter with a static value, then writes and removes its attributes, as code outside Xaendar would do.
 */
@WebComponent({
  selector: 'ex-attribute-inputs',
  styleUrl: './attribute-inputs.css',
  templateUrl: './attribute-inputs.xd.component.html'
})
export class AttributeInputsComponent extends CustomElement {
  /**
   * The meter.
   */
  @Query(MeterComponent)
  public accessor meter!: QuerySignal<MeterComponent | null>;
  /**
   * The attributes of the meter, as they are in the DOM.
   */
  public readonly attributesText = signal('value="3"');

  /**
   * Writes the value attribute of the meter.
   */
  public writeValue(): void {
    this.meter()?.setAttribute('value', '7');
    this._readAttributes();
  }

  /**
   * Adds or removes the compact attribute of the meter.
   */
  public toggleCompact(): void {
    this.meter()?.toggleAttribute('compact');
    this._readAttributes();
  }

  /**
   * Removes the value attribute of the meter, which resets its input to the default.
   */
  public removeValue(): void {
    this.meter()?.removeAttribute('value');
    this._readAttributes();
  }

  /**
   * Reads the attributes of the meter.
   */
  private _readAttributes(): void {
    const meter = this.meter();
    if (meter) {
      this.attributesText.set([...meter.attributes].map(({ name, value }) => `${name}="${value}"`).join(' ') || 'none');
    }
  }
}
