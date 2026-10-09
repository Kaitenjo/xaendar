import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Measures a resizable box with a ResizeObserver, and adapts its content to the width.
 */
@WebComponent({
  selector: 'ex-resize-observer',
  templateUrl: './resize-observer.xd.component.html',
  styleUrl: './resize-observer.css'
})
export class ResizeObserverComponent extends CustomElement {
  /**
   * The box to measure.
   */
  @Query('.box')
  public accessor box!: QuerySignal<HTMLElement | null>;
  /**
   * The width of the box, in pixels.
   */
  public readonly width = signal(0);
  /**
   * The observer, created once and connected to the box of each render.
   */
  private readonly _observer = new ResizeObserver(([entry]) => {
    if (entry) {
      this.width.set(Math.round(entry.contentRect.width));
    }
  });

  /**
   * Starts observing the box, which exists only once the template is rendered.
   */
  public afterRender(): void {
    const box = this.box();
    if (box) {
      this._observer.observe(box);
    }
  }

  /**
   * Stops observing: the box is about to be removed.
   */
  public onDestroy(): void {
    this._observer.disconnect();
  }
}
