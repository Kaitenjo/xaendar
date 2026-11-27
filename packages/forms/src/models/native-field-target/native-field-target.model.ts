import { signal } from '@xaendar/core/signals';
import type { FormError } from '../../types/form-error.type';
import type { FormFieldTarget } from '../../types/form-field-target.type';
import type { NativeFormField } from '../../types/native-form-field.type';
import { readNativeErrors, readNativeValue } from '../../utils/form-field/form-field.utils';

/**
 * A native field as `FormFieldDirective` works on it: an `<input>`, a `<select>` or a `<textarea>`. It has no signal of
 * its own, so its value is kept in one, read when it starts, on the `input` and `change` events of the user and after the
 * reset of its form; its own errors are the ones of its constraints (`required`, `minlength`, `type="email"`…), and the
 * errors of the validators become its custom error, the only one a native field takes. It has no custom states: CSS has
 * `:user-invalid` for it.
 */
export class NativeFieldTarget implements FormFieldTarget {
  /**
   * The form holding the field when the directive started.
   */
  public readonly form: HTMLFormElement | null;
  /**
   * The value of the field, as `readNativeValue` gives it.
   */
  private readonly _value = signal<unknown>(undefined);
  /**
   * The field.
   */
  private readonly _field: NativeFormField;

  /**
   * Takes a native field, reading its form and its value.
   *
   * @param field - The field.
   */
  constructor(field: NativeFormField) {
    this._field = field;
    this.form = field.form;
    this._value.set(readNativeValue(field));
  }

  /**
   * Gives the value of the field, read from its signal.
   *
   * @returns The value.
   */
  public value(): unknown {
    return this._value();
  }

  /**
   * Gives the error of the constraints of the field, with the message of the browser.
   *
   * @returns The error, none when its constraints pass.
   */
  public ownErrors(): readonly FormError[] {
    return readNativeErrors(this._field);
  }

  /**
   * Gives the field the first of the errors as its custom error, or none.
   *
   * @param errors - The errors of the validators.
   */
  public setCustomErrors(errors: readonly FormError[]): void {
    this._field.setCustomValidity(errors.length ? errors[0].message : '');
  }

  /**
   * Reads the value the user wrote.
   */
  public edited(): void {
    this._value.set(readNativeValue(this._field));
  }

  /**
   * Reads the value the reset of the form left.
   */
  public reset(): void {
    this._value.set(readNativeValue(this._field));
  }

  /**
   * Does nothing: a native field has no custom states.
   *
   * @param _state - The name of the state.
   * @param _on - Whether the field has it.
   */
  public writeState(_state: string, _on: boolean): void {
    // CSS has :user-invalid for a native field
  }
}
