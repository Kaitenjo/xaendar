import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A task of the board.
 */
type Task = {
  /**
   * The key of the task.
   */
  readonly id: number;
  /**
   * The text of the task.
   */
  readonly label: string;
  /**
   * Whether the task is done.
   */
  readonly done: boolean;
  /**
   * Whether the task is urgent.
   */
  readonly urgent: boolean;
};

/**
 * How much space the rows of the board take.
 */
type Density = 'comfortable' | 'compact';

/**
 * A board whose rows get their classes from an object, and the list its density from a string, with `@@class`.
 */
@WebComponent({
  selector: 'ex-task-board',
  styleUrl: './task-board.css',
  templateUrl: './task-board.xd.component.html'
})
export class TaskBoardComponent extends CustomElement {
  /**
   * The tasks.
   */
  public readonly tasks = signal<readonly Task[]>([
    { id: 1, label: 'Write the specs', done: true, urgent: false },
    { id: 2, label: 'Fix the login page', done: false, urgent: true },
    { id: 3, label: 'Update the docs', done: false, urgent: false }
  ]);
  /**
   * The key of the task selected.
   */
  public readonly selected = signal(2);
  /**
   * The density of the list, a class of its own.
   */
  public readonly density = signal<Density>('comfortable');

  /**
   * Selects a task.
   *
   * @param id - The key of the task.
   */
  public select(id: number): void {
    this.selected.set(id);
  }

  /**
   * Marks a task done, or not done any more.
   *
   * @param id - The key of the task.
   */
  public toggle(id: number): void {
    this.tasks.update(tasks => tasks.map(task => task.id === id ? { ...task, done: !task.done } : task));
  }

  /**
   * Switches the density of the list.
   */
  public toggleDensity(): void {
    this.density.update(density => density === 'compact' ? 'comfortable' : 'compact');
  }
}
