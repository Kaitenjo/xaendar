import { CustomDirective, Directive, Event } from '@xaendar/core';
import type { Output } from '@xaendar/core';

/**
 * Emits `resized` with the size of the element whenever it changes.
 */
@Directive({ selector: 'exResize' })
export class ResizeDirective extends CustomDirective<HTMLElement> {
  /**
   * Emitted with the new size of the content box, in pixels.
   */
  @Event()
  public accessor resized!: Output<{ width: number; height: number }>;
  /**
   * Observes the element.
   */
  private readonly _observer = new ResizeObserver(([entry]) => {
    if (entry) {
      const { width, height } = entry.contentRect;
      this.resized.emit({ width: Math.round(width), height: Math.round(height) });
    }
  });

  /**
   * Starts observing the element.
   */
  public onInit(): void {
    this._observer.observe(this.element);
  }

  /**
   * Stops observing.
   */
  public onDestroy(): void {
    this._observer.disconnect();
  }
}
