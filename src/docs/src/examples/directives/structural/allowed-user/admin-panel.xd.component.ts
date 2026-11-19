import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A panel shown after an asynchronous permission check.
 */
@WebComponent({
  selector: 'ex-admin-panel',
  styleUrl: './admin-panel.css',
  templateUrl: './admin-panel.xd.component.html'
})
export class AdminPanelComponent extends CustomElement {
  /**
   * The current user.
   */
  public readonly user = signal('admin');

  /**
   * Switches user.
   *
   * @param user - The new user.
   */
  public login(user: string): void {
    this.user.set(user);
  }

  /**
   * Switches to the guest and back to the admin at once, as a fast typist would.
   */
  public race(): void {
    this.user.set('guest');
    setTimeout(() => this.user.set('admin'), 300);
  }
}
