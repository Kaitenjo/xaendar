import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A list showing the context variables of each row, while rows are added at both ends and removed.
 */
@WebComponent({
  selector: 'ex-for-context',
  templateUrl: './for-context.xd.component.html',
  styleUrl: './for-context.css'
})
export class ForContextComponent extends CustomElement {
  /**
   * The tasks.
   */
  public readonly tasks = signal([{ id: 1, title: 'Write' }, { id: 2, title: 'Review' }, { id: 3, title: 'Ship' }]);
  /**
   * The identifier of the next task.
   */
  private _nextId = 4;

  /**
   * Adds a task at the top.
   */
  public prepend(): void {
    this.tasks.update(tasks => [{ id: this._nextId, title: `Task ${this._nextId++}` }, ...tasks]);
  }

  /**
   * Adds a task at the bottom.
   */
  public append(): void {
    this.tasks.update(tasks => [...tasks, { id: this._nextId, title: `Task ${this._nextId++}` }]);
  }

  /**
   * Removes a task.
   *
   * @param id - The identifier of the task.
   */
  public removeTask(id: number): void {
    this.tasks.update(tasks => tasks.filter(task => task.id !== id));
  }
}
