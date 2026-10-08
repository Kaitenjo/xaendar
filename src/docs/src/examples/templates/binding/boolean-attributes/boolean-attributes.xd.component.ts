import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Disables two buttons from the same signal: by binding the attribute, and with a conditional binding.
 */
@WebComponent({
  selector: 'ex-boolean-attributes',
  templateUrl: './boolean-attributes.xd.component.html',
  styleUrl: './boolean-attributes.css'
})
export class BooleanAttributesComponent extends CustomElement {
  /**
   * Whether the buttons should be disabled.
   */
  public readonly locked = signal(false);

  /**
   * Locks or unlocks the buttons.
   */
  public toggle(): void {
    this.locked.update(locked => !locked);
  }
}
