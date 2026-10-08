import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A box showing its own size, measured by a directive.
 */
@WebComponent({
  selector: 'ex-resizable-box',
  templateUrl: './resizable-box.xd.component.html',
  styleUrl: './resizable-box.css'
})
export class ResizableBoxComponent extends CustomElement {
  /**
   * The size of the box.
   */
  public readonly size = signal({ width: 0, height: 0 });

  /**
   * Stores the size emitted by the directive.
   *
   * @param event - The resized event.
   */
  public measure(event: CustomEvent<{ width: number; height: number }>): void {
    this.size.set(event.detail);
  }
}
