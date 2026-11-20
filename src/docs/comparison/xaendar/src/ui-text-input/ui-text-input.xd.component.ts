import { CustomElement, Model, Property, Query, WebComponent } from '@xaendar/core';
import type { InputSignal, ModelSignal, QuerySignal } from '@xaendar/core/signals';

/**
 * A text field with its label, bound two-way to its value.
 */
@WebComponent({
  selector: 'ui-text-input',
  styleUrl: '../../../shared/field.css',
  templateUrl: './ui-text-input.xd.component.html'
})
export class UiTextInputComponent extends CustomElement {
  /**
   * The label above the field.
   */
  @Property('')
  public accessor label!: InputSignal<string>;
  /**
   * The text shown while the field is empty.
   */
  @Property('')
  public accessor placeholder!: InputSignal<string>;
  /**
   * The value of the field.
   */
  @Model('')
  public accessor value!: ModelSignal<string>;
  /**
   * The native field.
   */
  @Query('input')
  public accessor control!: QuerySignal<HTMLInputElement | null>;

  /**
   * Keeps the native field showing the value, also when the parent changes it (a reset): an attribute would stop
   * mattering once the user typed.
   */
  public onInit(): void {
    this.effect(() => {
      const control = this.control();
      const value = this.value();
      if (control && control.value !== value) {
        control.value = value;
      }
    });
  }

  /**
   * Takes the value the user typed.
   *
   * @param control - The native field.
   */
  public write(control: HTMLInputElement): void {
    this.value.set(control.value);
  }
}
