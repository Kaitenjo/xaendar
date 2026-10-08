import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { fetchUser } from './api';
import type { User } from './api';

/**
 * Loads a user, showing the loading, error and data states.
 */
@WebComponent({
  selector: 'ex-user-loader',
  templateUrl: './user-loader.xd.component.html',
  styleUrl: './user-loader.css'
})
export class UserLoaderComponent extends CustomElement {
  /**
   * The ids offered, the last one unknown to the server.
   */
  public readonly ids = [1, 2, 3, 4];

  /**
   * The state of the request.
   */
  public readonly status = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');

  /**
   * The user loaded.
   */
  public readonly user = signal<User | null>(null);

  /**
   * The error of the last request.
   */
  public readonly error = signal('');

  /**
   * Aborts the request in progress.
   */
  private controller: AbortController | null = null;

  /**
   * Loads a user, aborting the request in progress.
   *
   * @param id - The id of the user.
   */
  public async load(id: number): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.status.set('loading');

    try {
      this.user.set(await fetchUser(id, controller.signal));
      this.status.set('ready');
    } catch (error) {
      // An aborted request was replaced by a newer one, which owns the state now
      if (!controller.signal.aborted) {
        this.error.set((error as Error).message);
        this.status.set('error');
      }
    }
  }

  /**
   * Aborts the request in progress: its answer would arrive after the component is gone.
   */
  public onDestroy(): void {
    this.controller?.abort();
  }
}
