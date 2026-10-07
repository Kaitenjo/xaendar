import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Signals compare values with Object.is: a mutated array is still the same array.
 */
@WebComponent({
  selector: 'ex-signal-identity',
  templateUrl: './identity.xd.component.html',
  styleUrl: './identity.css'
})
export class SignalIdentityComponent extends CustomElement {
  /**
   * A list of fruits.
   */
  public readonly fruits = signal(['apple']);

  /**
   * How many times the effect reading `fruits` ran.
   */
  public readonly runs = signal(0);

  /**
   * Counts the notifications of `fruits`.
   */
  public onInit(): void {
    this.effect(() => {
      this.fruits();
      this.runs.update(runs => runs + 1);
    });
  }

  /**
   * Mutates the array in place: the signal keeps the same reference, nobody is notified.
   */
  public pushInPlace(): void {
    this.fruits().push('pear');
  }

  /**
   * Sets the same array again: Object.is(old, new) is true, nobody is notified.
   */
  public setSame(): void {
    this.fruits.set(this.fruits());
  }

  /**
   * Sets a new array: the signal changes, and so does the template.
   */
  public replace(): void {
    this.fruits.update(fruits => [...fruits, 'cherry']);
  }
}
