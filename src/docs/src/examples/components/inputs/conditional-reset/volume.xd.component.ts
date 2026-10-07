import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A volume level, 50 unless bound.
 */
@WebComponent({
  selector: 'ex-volume',
  templateUrl: './volume.xd.component.html',
  styleUrl: './conditional-reset.css'
})
export class VolumeComponent extends CustomElement {
  /**
   * The level, from 0 to 100.
   */
  @Property(50)
  public accessor level!: InputSignal<number>;
}
