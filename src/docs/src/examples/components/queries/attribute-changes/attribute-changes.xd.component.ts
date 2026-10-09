import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Counts the selected tasks twice: with a query on a class, and from the state.
 */
@WebComponent({
  selector: 'ex-attribute-changes',
  templateUrl: './attribute-changes.xd.component.html',
  styleUrl: './attribute-changes.css'
})
export class AttributeChangesComponent extends CustomElement {
  /**
   * The tasks.
   */
  public readonly tasks = signal([
    { id: 1, title: 'Write the docs' },
    { id: 2, title: 'Fix the tests' },
    { id: 3, title: 'Release' }
  ]);
  /**
   * The identifiers of the selected tasks. Kept apart from the tasks, so that selecting one changes only a class,
   * not the rows of the list.
   */
  public readonly selectedIds = signal([1]);
  /**
   * The elements of the selected tasks, found by their class.
   */
  @Query.all('.selected')
  public accessor selectedElements!: QuerySignal<HTMLElement[]>;
  /**
   * The titles of the selected tasks, according to the query.
   */
  public readonly fromQuery = computed(() => this._computeFromQuery());
  /**
   * The titles of the selected tasks, according to the state.
   */
  public readonly fromState = computed(() => this._computeFromState());

  /**
   * Selects or deselects a task.
   *
   * @param id - The identifier of the task.
   */
  public toggle(id: number): void {
    this.selectedIds.update(ids => ids.includes(id) ? ids.filter(other => other !== id) : [...ids, id]);
  }

  /**
   * Adds a task, which changes the children of the list.
   */
  public addTask(): void {
    this.tasks.update(tasks => [...tasks, { id: tasks.length + 1, title: `Task ${tasks.length + 1}` }]);
  }

  /**
   * Computes the value of `fromQuery`.
   *
   * @returns The titles of the selected tasks, according to the query.
   */
  private _computeFromQuery(): string {
    return this.selectedElements().map(element => element.textContent).join(', ') || 'none';
  }

  /**
   * Computes the value of `fromState`.
   *
   * @returns The titles of the selected tasks, according to the state.
   */
  private _computeFromState(): string {
    return this.tasks().filter(task => this.selectedIds().includes(task.id)).map(task => task.title).join(', ') || 'none';
  }
}
