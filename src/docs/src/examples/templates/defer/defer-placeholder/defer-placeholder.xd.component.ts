import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A `@placeholder (minimum 2s)`: the content, rendered as soon as the template is by `load`, waits for the
 * `@placeholder` to be shown for 2 seconds. The button removes the block and renders it again.
 */
@WebComponent({
  selector: 'ex-defer-placeholder',
  styleUrl: './defer-placeholder.css',
  templateUrl: './defer-placeholder.xd.component.html'
})
export class DeferPlaceholderComponent extends CustomElement {
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
