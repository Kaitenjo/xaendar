import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Shows a user and lets the reader wave at them.
 */
@WebComponent({
  selector: 'ex-user-badge',
  templateUrl: './user-badge.xd.component.html',
  styleUrl: './user-badge.css'
})
export class UserBadgeComponent extends CustomElement {
  /**
   * The name of the user: an input the parent must bind.
   */
  @Property.required()
  public accessor name!: InputSignal<string>;

  /**
   * Whether the user is online: an optional input, `false` by default.
   */
  @Property(false)
  public accessor online!: InputSignal<boolean>;

  /**
   * An output: a `wave` event carrying the name of the user.
   */
  @Event()
  public accessor wave!: Output<string>;

  /**
   * Emits the `wave` event.
   */
  public sayHi(): void {
    this.wave.emit(this.name());
  }
}
