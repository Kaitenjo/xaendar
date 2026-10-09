import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Uses two `ex-user-badge` components: binds their inputs and listens to their outputs.
 */
@WebComponent({
  selector: 'ex-user-profile',
  templateUrl: './user-profile.xd.component.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent extends CustomElement {
  /**
   * Whether Ada is online.
   */
  public readonly adaOnline = signal(true);
  /**
   * The name carried by the last `wave` event.
   */
  public readonly lastWave = signal('nobody yet');

  /**
   * Toggles the status of Ada.
   */
  public toggle(): void {
    this.adaOnline.update(online => !online);
  }

  /**
   * Handles the `wave` event of a badge.
   *
   * @param event - The event, carrying the name of the user in its `detail`.
   */
  public onWave(event: CustomEvent<string>): void {
    this.lastWave.set(event.detail);
  }
}
