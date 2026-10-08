import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A list of tags with a duplicate, tracked by the tag itself.
 */
@WebComponent({
  selector: 'ex-duplicate-keys',
  templateUrl: './duplicate-keys.xd.component.html',
  styleUrl: './duplicate-keys.css'
})
export class DuplicateKeysComponent extends CustomElement {
  /**
   * The lists to show, one after the other.
   */
  public readonly lists = [['a', 'b', 'a'], ['b', 'a'], ['a', 'b', 'c']];

  /**
   * The position of the current list.
   */
  public readonly step = signal(0);

  /**
   * The current list.
   */
  public readonly tags = signal(['a', 'b', 'a']);

  /**
   * Shows the next list.
   */
  public next(): void {
    this.step.update(step => (step + 1) % this.lists.length);
    this.tags.set(this.lists[this.step()] ?? []);
  }
}
