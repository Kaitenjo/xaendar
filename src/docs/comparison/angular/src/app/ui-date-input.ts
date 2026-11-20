import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * A date field with its label, bound two-way to its value.
 */
@Component({
  selector: 'ui-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/field.css',
  template: `
    <label class="ui-field">
      <span class="ui-field__label">{{ label() }}</span>
      <input class="ui-field__control" type="date" [value]="value()" (input)="write($event)" />
    </label>
  `
})
export class UiDateInput {
  public readonly label = input('');
  public readonly value = model('');

  /**
   * Takes the value the user typed.
   */
  protected write(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
