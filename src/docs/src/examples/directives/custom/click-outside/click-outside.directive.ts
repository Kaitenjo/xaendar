import { CustomDirective, Directive, Event } from '@xaendar/core';
import type { Output } from '@xaendar/core';

/**
 * Emits `outside` when the pointer is pressed anywhere outside the element.
 */
@Directive({ selector: 'exClickOutside' })
export class ClickOutsideDirective extends CustomDirective<HTMLElement> {
  /**
   * Emitted on the element when the pointer is pressed outside of it.
   */
  @Event()
  public accessor outside!: Output;

  /**
   * Checks where the pointer was pressed. The path is used instead of the target, since the target
   * of an event coming out of a shadow root is the host of that root.
   *
   * @param event - The pointerdown event, as seen by the document.
   */
  private readonly check = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this.element)) {
      this.outside.emit();
    }
  };

  /**
   * Starts listening to the whole document.
   */
  public onInit(): void {
    document.addEventListener('pointerdown', this.check);
  }

  /**
   * Stops listening: the document outlives the element.
   */
  public onDestroy(): void {
    document.removeEventListener('pointerdown', this.check);
  }
}
