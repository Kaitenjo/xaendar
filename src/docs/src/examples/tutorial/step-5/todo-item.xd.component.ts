import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

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
   * The todo to show. Property types are written inline: the template compiler copies them as
   * text into the code that type-checks the templates using this component.
   */
  @Property.required()
  public accessor todo!: InputSignal<{ readonly id: number; readonly title: string; readonly done: boolean }>;

  /**
   * Emitted with the identifier of the todo when it is checked or unchecked.
   */
  @Event()
  public accessor doneChange!: Output<number>;

  /**
   * Emitted with the identifier of the todo when it has to be removed.
   */
  @Event()
  public accessor remove!: Output<number>;

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
    this.remove.emit(this.todo().id);
  }
}
