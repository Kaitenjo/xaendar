import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { Option } from '../../../shared/data';

/**
 * A select with its label, bound two-way to its value.
 */
@Component({
  selector: 'ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/field.css',
  template: `
    <label class="ui-field">
      <span class="ui-field__label">{{ label() }}</span>
      <select class="ui-field__control" [value]="value()" (change)="write($event)">
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </label>
  `
})
export class UiSelect {
  public readonly label = input('');
  public readonly options = input<readonly Option[]>([]);
  public readonly value = model('');

  /**
   * Takes the option the user chose.
   */
  protected write(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
