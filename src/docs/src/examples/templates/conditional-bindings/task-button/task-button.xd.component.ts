import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A button whose attributes and listener depend on three signals, through conditional bindings.
 */
@WebComponent({
  selector: 'ex-task-button',
  templateUrl: './task-button.xd.component.html',
  styleUrl: './task-button.css'
})
export class TaskButtonComponent extends CustomElement {
  /**
   * Whether the task is locked.
   */
  public readonly locked = signal(false);
  /**
   * Whether clicking the task edits it.
   */
  public readonly editable = signal(true);
  /**
   * The priority of the task.
   */
  public readonly priority = signal('low');
  /**
   * How many times the task was edited.
   */
  public readonly edits = signal(0);

  /**
   * Locks or unlocks the task.
   */
  public toggleLocked(): void {
    this.locked.update(locked => !locked);
  }

  /**
   * Turns editing on or off.
   */
  public toggleEditable(): void {
    this.editable.update(editable => !editable);
  }

  /**
   * Reads the priority.
   *
   * @param event - The change event of the select.
   */
  public setPriority(event: Event): void {
    this.priority.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Counts an edit.
   */
  public edit(): void {
    this.edits.update(edits => edits + 1);
  }
}
