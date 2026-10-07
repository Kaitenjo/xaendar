import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A todo.
 */
type Todo = {
  /**
   * Unique identifier.
   */
  readonly id: number;
  /**
   * What to do.
   */
  readonly title: string;
  /**
   * Whether it is done.
   */
  readonly done: boolean;
};

/**
 * Which todos are shown.
 */
type Filter = 'all' | 'active' | 'done';

/**
 * Step 5: rows are `ex-todo-item` components, and the list can be filtered.
 */
@WebComponent({
  selector: 'ex-todo-step-5',
  templateUrl: './step-5.xd.component.html',
  styleUrl: './step-5.css'
})
export class TodoStep5Component extends CustomElement {
  /**
   * The todos.
   */
  public readonly todos = signal<Todo[]>([
    { id: 1, title: 'Learn Xaendar', done: true },
    { id: 2, title: 'Build an app', done: false },
    { id: 3, title: 'Write the docs', done: false }
  ]);

  /**
   * The current filter.
   */
  public readonly filter = signal<Filter>('all');

  /**
   * The todos matching the filter.
   */
  public readonly visible = computed(() => {
    const filter = this.filter();
    return this.todos().filter(todo => filter === 'all' || (filter === 'done') === todo.done);
  });

  /**
   * How many todos are not done yet.
   */
  public readonly remaining = computed(() => this.todos().filter(todo => !todo.done).length);

  /**
   * The identifier of the next todo.
   */
  private nextId = 4;

  /**
   * Adds the todo typed in the form.
   *
   * @param event - The `submit` event of the form.
   */
  public add(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const title = new FormData(form).get('title')?.toString().trim();
    if (title) {
      this.todos.update(todos => [...todos, { id: this.nextId++, title, done: false }]);
    }
    form.reset();
  }

  /**
   * Handles the `doneChange` event of a row.
   *
   * @param event - The event, carrying the identifier of the todo.
   */
  public onDoneChange(event: CustomEvent<number>): void {
    this.todos.update(todos => todos.map(todo => todo.id === event.detail ? { ...todo, done: !todo.done } : todo));
  }

  /**
   * Handles the `remove` event of a row.
   *
   * @param event - The event, carrying the identifier of the todo.
   */
  public onRemove(event: CustomEvent<number>): void {
    this.todos.update(todos => todos.filter(todo => todo.id !== event.detail));
  }

  /**
   * Changes the filter.
   *
   * @param filter - The new filter.
   */
  public show(filter: Filter): void {
    this.filter.set(filter);
  }
}
