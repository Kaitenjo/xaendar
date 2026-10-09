import { CustomElement, Query, WebComponent } from '@xaendar/core';
import type { QuerySignal, Signal } from '@xaendar/core/signals';
import { signal } from '@xaendar/core/signals';
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
   * What the element logged. Typed, so that the template compiler knows it is a signal.
   */
  public readonly log: Signal<Array<{ id: number; text: string }>>;
  /**
   * The element, created once with its constructor: the template does not render it.
   */
  private readonly _target = new MoveTargetComponent();

  /**
   * Exposes the log of the element, which exists only once the element is created.
   */
  public constructor() {
    super();
    this.log = this._target.log;
  }

  /**
   * Puts the element in its box, which exists only once the template is rendered.
   */
  public afterRender(): void {
    this._getBox()?.append(this._target);
  }

  /**
   * Moves the element to the other box.
   */
  public move(): void {
    this._getBox()?.append(this._target);
  }

  /**
   * Clears the log.
   */
  public clear(): void {
    this.log.set([]);
  }

  /**
   * Get the current box element based on the where value
   * @returns Box holding the element
   */
  private _getBox(): HTMLElement | null {
    return this.where() === 'A' ? this.boxA() : this.boxB();
  }
}
