import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

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
 * Step 3: a form adds new todos.
 */
@WebComponent({
  selector: 'ex-todo-step-3',
  templateUrl: './step-3.xd.component.html',
  styleUrl: './step-3.css'
})
export class TodoStep3Component extends CustomElement {
  /**
   * The todos.
   */
  public readonly todos = signal<Todo[]>([
    { id: 1, title: 'Learn Xaendar', done: true },
    { id: 2, title: 'Build an app', done: false }
  ]);

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
      // Signals are immutable values: a new array notifies the template, push() would not
      this.todos.update(todos => [...todos, { id: this.nextId++, title, done: false }]);
    }
    form.reset();
  }
}
