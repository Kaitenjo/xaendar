import { CustomElement, Query, WebComponent } from '@xaendar/core';
import type { ComponentRef } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { NewestDirective } from './newest.directive';
import { NotificationComponent } from './notification.xd.component';

/**
 * A stack of notifications, each one created in code with this.createComponent.
 */
@WebComponent({
  selector: 'ex-notifications',
  styleUrl: './notifications.css',
  templateUrl: './notifications.xd.component.html'
})
export class NotificationsComponent extends CustomElement {
  /**
   * The element the notifications are appended to.
   */
  @Query<HTMLElement>('.stack')
  public accessor stack!: QuerySignal<HTMLElement | null>;
  /**
   * Whether the notifications are urgent.
   */
  public readonly urgent = signal(false);
  /**
   * The number of notifications open.
   */
  public readonly open = signal(0);
  /**
   * The id of the newest notification.
   */
  private readonly _newest = signal(0);
  /**
   * The notifications open.
   */
  private readonly _notifications = new Set<ComponentRef<NotificationComponent>>();

  /**
   * Creates a notification at the bottom of the stack: urgent while urgent holds, marked while it is the newest one.
   */
  public add(): void {
    const stack = this.stack();
    if (!stack) {
      return;
    }

    const id = this._newest() + 1;
    this._newest.set(id);
    const notification = this.createComponent(NotificationComponent, {
      target: stack,
      properties: [{ condition: () => this.urgent(), level: () => 'urgent' }],
      // A body in braces: returning the call would make the type of notification depend on itself
      events: [{ dismissed: () => { this._dismiss(notification); } }],
      directives: [{ directive: NewestDirective, condition: () => this._newest() === id }],
      // Projected into the slot of the notification
      content: [document.createTextNode(`Notification #${id}`)]
    });
    this._notifications.add(notification);
    this.open.set(this._notifications.size);
  }

  /**
   * Toggles urgent.
   */
  public toggleUrgent(): void {
    this.urgent.update(urgent => !urgent);
  }

  /**
   * Destroys a notification.
   *
   * @param notification - The notification to destroy.
   */
  private _dismiss(notification: ComponentRef<NotificationComponent>): void {
    notification.destroy();
    this._notifications.delete(notification);
    this.open.set(this._notifications.size);
  }

  /**
   * Forgets the notifications: they are destroyed along with the stack, which created them.
   */
  public onDestroy(): void {
    this._notifications.clear();
    this.open.set(0);
  }
}
