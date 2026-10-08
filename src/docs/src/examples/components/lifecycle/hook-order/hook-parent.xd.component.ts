import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { write } from './hook-order.log';

/**
 * A parent logging its hooks, around a child.
 */
@WebComponent({
  selector: 'ex-hook-parent',
  templateUrl: './hook-parent.xd.component.html',
  styleUrl: './hook-parent.css'
})
export class HookParentComponent extends CustomElement {
  /**
   * The label, passed on to the child.
   */
  @Property('—')
  public accessor label!: InputSignal<string>;

  /**
   * Logs the creation of the element.
   */
  public constructor() {
    super();
    write('parent · constructor');
  }

  /**
   * Logs the connection, before the render.
   */
  public onInit(): void {
    write('parent · onInit');
  }

  /**
   * Logs the end of the render.
   */
  public afterRender(): void {
    write('parent · afterRender');
  }

  /**
   * Logs the disconnection.
   */
  public onDestroy(): void {
    write('parent · onDestroy');
  }
}
