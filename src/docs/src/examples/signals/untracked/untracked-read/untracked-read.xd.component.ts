import { CustomElement, WebComponent } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';

/**
 * An effect that reads `message` tracked and `user` untracked: only `message` triggers it.
 */
@WebComponent({
  selector: 'ex-untracked-read',
  templateUrl: './untracked-read.xd.component.html',
  styleUrl: './untracked-read.css'
})
export class UntrackedReadComponent extends CustomElement {
  /**
   * The message to send: a tracked dependency.
   */
  public readonly message = signal('Hello');
  /**
   * The current user: read without tracking.
   */
  public readonly user = signal('Ada');
  /**
   * The messages "sent" by the effect.
   */
  public readonly sent = signal<Array<{ id: number; text: string }>>([]);

  /**
   * Sends every new message, signed by whoever is the user at that moment.
   */
  public onInit(): void {
    this.effect(() => {
      const message = this.message();
      const user = untracked(() => this.user());
      this.sent.update(sent => [...sent, { id: sent.length, text: `${user}: ${message}` }]);
    });
  }

  /**
   * Changes the message: the effect runs.
   */
  public newMessage(): void {
    this.message.update(message => message === 'Hello' ? 'How are you?' : 'Hello');
  }

  /**
   * Changes the user: the effect does not run, but the next message will be signed by the new user.
   */
  public switchUser(): void {
    this.user.update(user => user === 'Ada' ? 'Grace' : 'Ada');
  }
}
