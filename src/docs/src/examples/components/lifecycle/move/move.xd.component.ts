import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal, Signal } from '@xaendar/core/signals';
import { MoveTargetComponent } from './move-target.xd.component';

/**
 * Moves an element between two boxes: each move disconnects it and connects it again.
 */
@WebComponent({
  selector: 'ex-move',
  templateUrl: './move.xd.component.html',
  styleUrl: './move.css'
})
export class MoveComponent extends CustomElement {
  /**
   * The first box.
   */
  @Query('.box--a')
  public accessor boxA!: QuerySignal<HTMLElement | null>;

  /**
   * The second box.
   */
  @Query('.box--b')
  public accessor boxB!: QuerySignal<HTMLElement | null>;

  /**
   * The box holding the element.
   */
  public readonly where = signal('A');

  /**
   * The element, created once with its constructor: the template does not render it.
   */
  private readonly target = new MoveTargetComponent();

  /**
   * What the element logged. Typed, so that the template compiler knows it is a signal.
   */
  public readonly log: Signal<Array<{ id: number; text: string }>> = this.target.log;

  /**
   * Puts the element in its box, which exists only once the template is rendered.
   */
  public afterRender(): void {
    (this.where() === 'A' ? this.boxA() : this.boxB())?.append(this.target);
  }

  /**
   * Moves the element to the other box.
   */
  public move(): void {
    this.where.update(where => where === 'A' ? 'B' : 'A');
    (this.where() === 'A' ? this.boxA() : this.boxB())?.append(this.target);
  }

  /**
   * Clears the log.
   */
  public clear(): void {
    this.log.set([]);
  }
}
