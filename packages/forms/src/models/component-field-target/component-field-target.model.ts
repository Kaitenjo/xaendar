import type { FormAssociatedDirective } from '../../directives/form-associated/form-associated.directive';
import type { FormError } from '../../types/form-error.type';
import type { FormFieldTarget } from '../../types/form-field-target.type';
import { writeState } from '../../utils/form-field/form-field.utils';

/**
 * A component as `FormFieldDirective` works on it, through its `FormAssociatedDirective`: its value is the signal it
 * gives the form, its own errors the ones of its validators, the errors of the validators of the directive join them in
 * its validity, and its states go to CSS as custom states (`:state(touched)`). It reads its value itself, so the events
 * of the user and the reset of the form leave nothing to read.
 */
export class ComponentFieldTarget implements FormFieldTarget {
  /**
   * The form holding the component when the directive started.
   */
  public readonly form: HTMLFormElement | null;
  /**
   * The bridge of the component with the form.
   */
  private readonly _bridge: FormAssociatedDirective;

  /**
   * Takes the bridge of a component.
   *
   * @param bridge - The `FormAssociatedDirective` of the component.
   */
  constructor(bridge: FormAssociatedDirective) {
    this._bridge = bridge;
    this.form = bridge.internals?.form ?? null;
  }

  /**
   * Gives the value the component gives the form, read from its signal.
   *
   * @returns The value, `undefined` before the component gives it.
   */
  public value(): unknown {
    return this._bridge.source?.();
  }

  /**
   * Gives the errors of the validators of the component.
   *
   * @returns The errors.
   */
  public ownErrors(): readonly FormError[] {
    return this._bridge.errors();
  }

  /**
   * Gives the component the errors of the validators of the directive, joining its own ones in its validity.
   *
   * @param errors - The errors.
   */
  public setCustomErrors(errors: readonly FormError[]): void {
    this._bridge.setCustomErrors(errors);
  }

  /**
   * Does nothing: the component gives its value through its signal.
   */
  public edited(): void {
    // The value is the signal of the component, which follows the user by itself
  }

  /**
   * Does nothing: the reset of the form writes the value back through the bridge.
   */
  public reset(): void {
    // FormAssociatedDirective.formResetCallback writes the value back
  }

  /**
   * Shows a state of the component as a custom state, where the DOM has `ElementInternals`.
   *
   * @param state - The name of the state.
   * @param on - Whether the component has it.
   */
  public writeState(state: string, on: boolean): void {
    const internals = this._bridge.internals;
    if (internals) {
      writeState(internals, state, on);
    }
  }
}
