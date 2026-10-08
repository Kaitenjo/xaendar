import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Two asynchronous directives, one reading its input before the first await, one after.
 */
@WebComponent({
  selector: 'ex-late-read',
  templateUrl: './late-read.xd.component.html',
  styleUrl: './late-read.css'
})
export class LateReadComponent extends CustomElement {
  /**
   * The current user.
   */
  public readonly user = signal('admin');

  /**
   * Switches between the admin and the guest.
   */
  public toggle(): void {
    this.user.update(user => (user === 'admin' ? 'guest' : 'admin'));
  }
}
