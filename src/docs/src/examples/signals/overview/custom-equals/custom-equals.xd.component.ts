import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A custom equality function decides when a new value counts as a change.
 */
@WebComponent({
  selector: 'ex-signal-custom-equals',
  templateUrl: './custom-equals.xd.component.html',
  styleUrl: './custom-equals.css'
})
export class SignalCustomEqualsComponent extends CustomElement {
  /**
   * A name compared case-insensitively: "ADA" is not a change from "Ada".
   */
  public readonly name = signal('Ada', {
    equals: (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
  });
  /**
   * A name compared with the default equality, Object.is.
   */
  public readonly strictName = signal('Ada');

  /**
   * Applies the text typed by the reader to both signals.
   *
   * @param event - The `input` event of the field.
   */
  public onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.name.set(value);
    this.strictName.set(value);
  }
}
