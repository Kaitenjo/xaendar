import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Iterates the entries of a Map of scores, counting them with $count, and shows its @empty once the Map is cleared.
 */
@WebComponent({
  selector: 'ex-for-iterables',
  styleUrl: './for-iterables.css',
  templateUrl: './for-iterables.xd.component.html'
})
export class ForIterablesComponent extends CustomElement {
  /**
   * The scores, by player.
   */
  public readonly scores = signal(new Map([['Ada', 12], ['Grace', 9]]));

  /**
   * Adds a point to a player, replacing the Map so that the signal notifies.
   *
   * @param player - The player.
   */
  public score(player: string): void {
    this.scores.update(scores => new Map(scores).set(player, (scores.get(player) ?? 0) + 1));
  }

  /**
   * Adds a new player, or clears the scores when there are three.
   */
  public next(): void {
    this.scores.update(scores => scores.size === 3 ? new Map() : new Map(scores).set(['Ada', 'Grace', 'Linus'][scores.size], 0));
  }
}
