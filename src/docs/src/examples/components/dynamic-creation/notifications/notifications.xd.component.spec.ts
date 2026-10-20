import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { NotificationComponent } from './notification.xd.component';
import { NotificationsComponent } from './notifications.xd.component';

/**
 * Waits for the template, for the queries and for the effects, updated a microtask after a change.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): NotificationsComponent {
  const element = document.createElement('ex-notifications');
  if (!(element instanceof NotificationsComponent)) {
    throw new Error('ex-notifications is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The notifications in the stack of the example.
 */
function notificationsOf(element: NotificationsComponent): NotificationComponent[] {
  return Array.from(element.stack()!.children).filter(child => child instanceof NotificationComponent);
}

describe('NotificationsComponent', () => {
  // happy-dom has no ElementInternals, which the buttons of the example set their role and state on
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => ({}) });
  });

  afterEach(() => document.body.replaceChildren());

  it('creates the notifications in the stack, marking only the newest one', async () => {
    const element = mount();
    await flush();

    element.add();
    element.add();
    await flush();
    const notifications = notificationsOf(element);

    expect(notifications.map(notification => notification.message())).toEqual(['Notification #1', 'Notification #2']);
    expect(notifications.map(notification => notification.classList.contains('newest'))).toEqual([false, true]);
    expect(element.open()).toBe(2);
  });

  it('makes the notifications urgent only while urgent holds', async () => {
    const element = mount();
    await flush();
    element.add();

    element.toggleUrgent();
    await flush();
    expect(notificationsOf(element)[0].level()).toBe('urgent');

    element.toggleUrgent();
    await flush();
    expect(notificationsOf(element)[0].level()).toBe('info');
  });

  it('destroys a notification when it is dismissed', async () => {
    const element = mount();
    await flush();
    element.add();
    element.add();
    await flush();

    notificationsOf(element)[1].dismiss();
    await flush();

    expect(notificationsOf(element).map(notification => notification.message())).toEqual(['Notification #1']);
    expect(element.open()).toBe(1);
  });

  it('destroys the notifications still open when it is destroyed', async () => {
    const element = mount();
    await flush();
    element.add();
    const stack = element.stack()!;

    element.remove();

    expect(stack.children).toHaveLength(0);
    expect(element.open()).toBe(0);
  });
});
