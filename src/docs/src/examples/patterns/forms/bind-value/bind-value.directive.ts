import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Writes a signal into the value property of a field. The value attribute is only the initial value:
 * once the user types, the field ignores it.
 */
@Directive({ selector: 'exBindValue' })
export class BindValueDirective extends CustomDirective<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  /**
   * The value to show.
   */
  @Property('')
  public accessor value!: InputSignal<string>;

  /**
   * Keeps the property in sync with the input. The options of a select are rendered after onInit,
   * so the effect starts a microtask later, when they exist.
   */
  public onInit(): void {
    queueMicrotask(() => {
      this.effect(() => {
        const value = this.value();
        // Writing the same value again would move the caret to the end while the user types
        if (this.element.value !== value) {
          this.element.value = value;
        }
      });
    });
  }
}
