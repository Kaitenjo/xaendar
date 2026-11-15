import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * An item of the list.
 */
type Task = {
  /**
   * The key of the item.
   */
  readonly id: number;
  /**
   * The text of the item.
   */
  readonly label: string;
};

/**
 * A list whose rows fade in when added and fade out when removed, with the classes of a stylesheet.
 */
@WebComponent({
  selector: 'ex-animated-list',
  styleUrl: './animated-list.css',
  templateUrl: './animated-list.xd.component.html'
})
export class AnimatedListComponent extends CustomElement {
  /**
   * The rows.
   */
  public readonly tasks = signal<readonly Task[]>([
    { id: 1, label: 'Write the specs' },
    { id: 2, label: 'Review the pull request' },
    { id: 3, label: 'Update the docs' }
  ]);
  /**
   * The key of the next row added.
   */
  private _next = 4;

  /**
   * Adds a row at the top.
   */
  public add(): void {
    const id = this._next++;
    this.tasks.update(tasks => [{ id, label: `Task ${id}` }].concat(tasks));
  }

  /**
   * Removes a row, once its task is done.
   *
   * @param id - The key of the row.
   */
  public complete(id: number): void {
    this.tasks.update(tasks => tasks.filter(task => task.id !== id));
  }

  /**
   * Moves the last row to the top.
   */
  public rotate(): void {
    this.tasks.update(tasks => tasks.slice(-1).concat(tasks.slice(0, -1)));
  }
}
