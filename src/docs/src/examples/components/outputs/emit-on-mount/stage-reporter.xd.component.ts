import { CustomElement, Event, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';

/**
 * Emits an event from each lifecycle hook, and one more a microtask after the render.
 */
@WebComponent({
  selector: 'ex-stage-reporter',
  templateUrl: './stage-reporter.xd.component.html'
})
export class StageReporterComponent extends CustomElement {
  /**
   * Emitted at each step, with the name of the step as detail.
   */
  @Event()
  public accessor stage!: Output<string>;

  /**
   * Emits before the render.
   */
  public onInit(): void {
    this.stage.emit('onInit');
  }

  /**
   * Emits after the render, then again a microtask later.
   */
  public afterRender(): void {
    this.stage.emit('afterRender');
    queueMicrotask(() => this.stage.emit('a microtask after afterRender'));
  }

  /**
   * Emits on removal.
   */
  public onDestroy(): void {
    this.stage.emit('onDestroy');
  }
}
