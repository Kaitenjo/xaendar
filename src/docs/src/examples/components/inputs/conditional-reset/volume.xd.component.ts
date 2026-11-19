import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A volume level, 50 unless bound.
 */
@WebComponent({
  selector: 'ex-volume',
  styleUrl: './conditional-reset.css',
  templateUrl: './volume.xd.component.html'
})
export class VolumeComponent extends CustomElement {
  /**
   * The level, from 0 to 100.
   */
  @Property(50)
  public accessor level!: InputSignal<number>;
}
