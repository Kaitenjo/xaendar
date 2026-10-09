import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { checks } from './permissions';

/**
 * A panel shown after an asynchronous permission check.
 */
@WebComponent({
  selector: 'ex-admin-panel',
  templateUrl: './admin-panel.xd.component.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanelComponent extends CustomElement {
  /**
   * The current user.
   */
  public readonly user = signal('admin');
  /**
   * The log of the checks, shared with the directive.
   */
  public readonly checks = checks;

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
