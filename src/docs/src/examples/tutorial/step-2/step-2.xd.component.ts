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
 * Step 2: the todos live in a signal, and the template renders them.
 */
@WebComponent({
  selector: 'ex-todo-step-2',
  templateUrl: './step-2.xd.component.html',
  styleUrl: './step-2.css'
})
export class TodoStep2Component extends CustomElement {
  /**
   * The todos.
   */
  public readonly todos = signal<Todo[]>([
    { id: 1, title: 'Learn Xaendar', done: true },
    { id: 2, title: 'Build an app', done: false }
  ]);
}
