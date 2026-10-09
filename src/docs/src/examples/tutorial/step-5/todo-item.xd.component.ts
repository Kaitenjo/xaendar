import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { Todo } from './step-5.xd.component';

/**
 * Step 5: a row of the list, extracted in its own component.
 */
@WebComponent({
  selector: 'ex-todo-item',
  templateUrl: './todo-item.xd.component.html',
  styleUrl: './step-5.css'
})
export class TodoItemComponent extends CustomElement {
  /**
   * The todo to show.
   */
  @Property.required()
  public accessor todo!: InputSignal<Todo>;
  /**
   * Emitted with the identifier of the todo when it is checked or unchecked.
   */
  @Event()
  public accessor doneChange!: Output<number>;
  /**
   * Emitted with the identifier of the todo when it has to be removed.
   */
  @Event()
  public accessor removed!: Output<number>;

  /**
   * Asks the parent to toggle the todo.
   */
  public toggle(): void {
    this.doneChange.emit(this.todo().id);
  }

  /**
   * Asks the parent to remove the todo.
   */
  public delete(): void {
    this.removed.emit(this.todo().id);
  }
}
