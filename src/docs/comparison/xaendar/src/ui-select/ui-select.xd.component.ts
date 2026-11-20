import { CustomElement, Model, Property, Query, WebComponent } from '@xaendar/core';
import type { InputSignal, ModelSignal, QuerySignal } from '@xaendar/core/signals';
import type { Option } from '../../../shared/data';

/**
 * A select with its label, bound two-way to its value.
 */
@WebComponent({
  selector: 'ui-select',
  styleUrl: '../../../shared/field.css',
  templateUrl: './ui-select.xd.component.html'
})
export class UiSelectComponent extends CustomElement {
  /**
   * The label above the select.
   */
  @Property('')
  public accessor label!: InputSignal<string>;
  /**
   * The options.
   */
  @Property<InputSignal<readonly Option[]>>([])
  public accessor options!: InputSignal<readonly Option[]>;
  /**
   * The value of the selected option.
   */
  @Model('')
  public accessor value!: ModelSignal<string>;
  /**
   * The native select.
   */
  @Query('select')
  public accessor control!: QuerySignal<HTMLSelectElement | null>;

  /**
   * Keeps the native select showing the value, also when the parent changes it or the options change.
   */
  public onInit(): void {
    this.effect(() => {
      const control = this.control();
      const value = this.value();
      this.options();
      if (control && control.value !== value) {
        control.value = value;
      }
    });
  }

  /**
   * Takes the option the user chose.
   *
   * @param control - The native select.
   */
  public write(control: HTMLSelectElement): void {
    this.value.set(control.value);
  }
}
