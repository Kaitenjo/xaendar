import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { write } from './hook-order.log';

/**
 * A child logging its hooks and an effect reading its input.
 */
@WebComponent({
  selector: 'ex-hook-child',
  templateUrl: './hook-child.xd.component.html',
  styleUrl: './hook-child.css'
})
export class HookChildComponent extends CustomElement {
  /**
   * The label to show.
   */
  @Property('—')
  public accessor label!: InputSignal<string>;

  /**
   * Logs the creation of the element.
   */
  public constructor() {
    super();
    write('child · constructor');
  }

  /**
   * Logs the connection, and starts an effect that logs the label and its own disposal.
   */
  public onInit(): void {
    write(`child · onInit, label ${this.label()}`);
    this.effect(() => write(`child · effect, label ${this.label()}`), {
      onCleanup: () => write('child · effect disposed')
    });
  }

  /**
   * Logs the end of the render.
   */
  public afterRender(): void {
    write(`child · afterRender, label ${this.label()}`);
  }

  /**
   * Logs the disconnection.
   */
  public onDestroy(): void {
    write('child · onDestroy');
  }
}
