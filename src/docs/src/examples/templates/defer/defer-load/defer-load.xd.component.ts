import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A `@defer (load)`, whose content is rendered as soon as the template holding it is, without blocking it. The button
 * removes the block and renders it again.
 */
@WebComponent({
  selector: 'ex-defer-load',
  styleUrl: './defer-load.css',
  templateUrl: './defer-load.xd.component.html'
})
export class DeferLoadComponent extends CustomElement {
  /**
   * Whether the block is rendered.
   */
  public readonly shown = signal(true);
  /**
   * When the block was rendered last, as `performance.now()` measures it.
   */
  private _renderedAt = performance.now();

  /**
   * Removes the block, or renders it again, its triggers armed anew.
   */
  public toggle(): void {
    this._renderedAt = performance.now();
    this.shown.update(shown => !shown);
  }

  /**
   * Returns the milliseconds passed since the block was rendered.
   *
   * @returns The milliseconds, rounded.
   */
  public elapsed(): number {
    return Math.round(performance.now() - this._renderedAt);
  }
}
