import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The same signal written into a field as an attribute, and as a property through a directive.
 */
@WebComponent({
  selector: 'ex-bind-value-demo',
  templateUrl: './bind-value-demo.xd.component.html',
  styleUrl: './bind-value-demo.css'
})
export class BindValueDemoComponent extends CustomElement {
  /**
   * The text of both fields.
   */
  public readonly text = signal('Ada');

  /**
   * The size chosen.
   */
  public readonly size = signal('m');

  /**
   * Stores the text typed in either field.
   *
   * @param event - The input event.
   */
  public type(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  /**
   * Stores the size chosen.
   *
   * @param event - The change event.
   */
  public choose(event: Event): void {
    this.size.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Clears the text and resets the size.
   */
  public reset(): void {
    this.text.set('');
    this.size.set('m');
  }

  /**
   * Turns the text to upper case.
   */
  public shout(): void {
    this.text.update(text => text.toUpperCase());
  }
}
