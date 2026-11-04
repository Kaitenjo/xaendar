import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A task with the note saved for it.
 */
type Task = {
  /**
   * The identifier of the task, which the rows are tracked by.
   */
  readonly id: number;
  /**
   * The name of the task.
   */
  readonly name: string;
  /**
   * The note saved for the task.
   */
  readonly note: string;
};

/**
 * Gives every row of a `@for` its own field, named by the same element ref in each one.
 */
@WebComponent({
  selector: 'ex-row-notes',
  styleUrl: './row-notes.css',
  templateUrl: './row-notes.xd.component.html'
})
export class RowNotesComponent extends CustomElement {
  /**
   * The tasks, one per row.
   */
  public readonly tasks = signal<Task[]>([
    { id: 1, name: 'Write', note: '' },
    { id: 2, name: 'Review', note: '' },
    { id: 3, name: 'Ship', note: '' }
  ]);

  /**
   * Saves the note of a task, typed in the field of its row.
   *
   * @param id - The identifier of the task.
   * @param note - The value of the field of its row.
   */
  public save(id: number, note: string): void {
    this.tasks.update(tasks => tasks.map(task => (task.id === id ? { ...task, note } : task)));
  }

  /**
   * Reverses the order of the tasks: the rows move with their fields.
   */
  public reverse(): void {
    this.tasks.update(tasks => [...tasks].reverse());
  }
}
