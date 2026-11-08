import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A `@defer` with two triggers, the first one firing renders the content: the click on the button of the `@placeholder`,
 * or 5 seconds passing. The button above removes the block and renders it again.
 */
@WebComponent({
  selector: 'ex-defer-several',
  styleUrl: './defer-several.css',
  templateUrl: './defer-several.xd.component.html'
})
export class DeferSeveralComponent extends CustomElement {
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
