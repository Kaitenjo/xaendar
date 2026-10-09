import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { fetchUser } from '../user-loader/api';

/**
 * Two loaders receiving the same requests: one keeps the last answer to arrive, the other the last one asked for.
 */
@WebComponent({
  selector: 'ex-race',
  templateUrl: './race.xd.component.html',
  styleUrl: './race.css'
})
export class RaceComponent extends CustomElement {
  /**
   * The user asked for last.
   */
  public readonly selected = signal(0);
  /**
   * The user shown by the naive loader.
   */
  public readonly naive = signal('—');
  /**
   * The user shown by the loader aborting stale requests.
   */
  public readonly safe = signal('—');
  /**
   * Aborts the request in progress of the second loader.
   */
  private _controller: AbortController | null = null;

  /**
   * Asks for the slow user 1, then for user 2 right away.
   */
  public race(): void {
    this._ask(1);
    this._ask(2);
  }

  /**
   * Sends the same request to both loaders.
   *
   * @param id - The id of the user.
   */
  private _ask(id: number): void {
    this.selected.set(id);
    this.naive.set('loading…');
    this.safe.set('loading…');
    void this._loadNaive(id);
    void this._loadSafe(id);
  }

  /**
   * Shows whatever answer arrives, in the order it arrives.
   *
   * @param id - The id of the user.
   */
  private async _loadNaive(id: number): Promise<void> {
    const user = await fetchUser(id);
    this.naive.set(user.name);
  }

  /**
   * Aborts the previous request before sending a new one.
   *
   * @param id - The id of the user.
   */
  private async _loadSafe(id: number): Promise<void> {
    this._controller?.abort();
    const controller = new AbortController();
    this._controller = controller;
    try {
      const user = await fetchUser(id, controller.signal);
      this.safe.set(user.name);
    } catch {
      // Aborted: a newer request owns the state
    }
  }
}
