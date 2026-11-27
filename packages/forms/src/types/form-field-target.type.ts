import type { FormError } from './form-error.type';

/**
 * What `FormFieldDirective` works on, the same for every kind of field: a native one (`NativeFieldTarget`) or a
 * component with its `FormAssociatedDirective` (`ComponentFieldTarget`). The directive keeps the states and runs the
 * validators; the target reads and writes the field the way its kind asks.
 */
export type FormFieldTarget = {
  /**
   * The form holding the field when the directive started, whose reset makes it untouched and pristine.
   */
  readonly form: HTMLFormElement | null;
  /**
   * Gives the value of the field, read from a signal so that the validation follows it.
   *
   * @returns The value.
   */
  value(): unknown;
  /**
   * Gives the errors the field finds itself: the constraints of a native field, the validators of a component.
   *
   * @returns The errors.
   */
  ownErrors(): readonly FormError[];
  /**
   * Gives the field the errors of the validators of the directive, which the browser shows with its own ones.
   *
   * @param errors - The errors, none to remove them.
   */
  setCustomErrors(errors: readonly FormError[]): void;
  /**
   * Takes what the user changed, on an `input` or a `change` event of the field.
   */
  edited(): void;
  /**
   * Takes the field as the reset of its form left it.
   */
  reset(): void;
  /**
   * Shows a state of the field to CSS, where the field can have custom states.
   *
   * @param state - The name of the state.
   * @param on - Whether the field has it.
   */
  writeState(state: string, on: boolean): void;
};
