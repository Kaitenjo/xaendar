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
 * Step 4: todos can be completed and removed, a computed signal counts the remaining ones.
 */
@WebComponent({
  selector: 'ex-todo-step-4',
  templateUrl: './step-4.xd.component.html',
  styleUrl: './step-4.css'
})
export class TodoStep4Component extends CustomElement {
  /**
   * The todos.
   */
  public readonly todos = signal<Todo[]>([
    { id: 1, title: 'Learn Xaendar', done: true },
    { id: 2, title: 'Build an app', done: false }
  ]);

  /**
   * How many todos are not done yet.
   */
  public readonly remaining = computed(() => this.todos().filter(todo => !todo.done).length);

  /**
   * The identifier of the next todo.
   */
  private nextId = 3;

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
   * Marks a todo as done, or not done.
   *
   * @param id - The identifier of the todo.
   */
  public toggle(id: number): void {
    this.todos.update(todos => todos.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo));
  }

  /**
   * Removes a todo.
   *
   * @param id - The identifier of the todo.
   */
  public remove(id: number): void {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
  }
}
