import { CustomDirective, CustomElement, Directive, HostListener, Property } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal, ReadonlySignal } from '@xaendar/core/signals';
import type { FormError } from '../../types/form-error.type';
import type { FormValidator } from '../../types/form-validator.type';
import type { NativeFormField } from '../../types/native-form-field.type';
import { findFormErrors, isNativeFormField, joinFormErrors, NO_FORM_ERRORS, NO_FORM_VALIDATORS, readNativeErrors, readNativeValue, writeState } from '../../utils/form-control/form-control.utils';
import { FormAssociatedDirective } from '../form-associated/form-associated.directive';

/**
 * Gives a field of a form the states and the validators of Angular's `ngModel` and `formControl`: `untouched`,
 * `pristine`, `valid` and every error found, as read-only signals. The code using the field applies it in its template,
 * on a native field (`<input>`, `<select>`, `<textarea>`) or on a component declaring `FormAssociatedDirective`, and
 * reaches it with a query (`@Query.ref('name', { read: FormControlDirective })`), as Angular's `#name="ngModel"`.
 *
 * The validators receive the value of the field: the one of the native field, read on its `input` and `change` events
 * as Angular's value accessors give it (see `readNativeValue`), or the one the component gives the form. Their errors
 * join the ones the field finds itself, the constraints of a native field (`required`, `minlength`, `type="email"`…,
 * with the message of the browser) or the validators of the component, in `errors`; to the browser they go as the
 * custom error of a native field (`setCustomValidity()`) or as the custom errors of the component, so the form blocks
 * the submission and `:invalid` matches.
 *
 * The field is touched when the user leaves it (`focusout`), as Angular's on `blur`, and dirty as soon as the user
 * changes its value, an `input` or `change` event, even to the same value or back to the first one; both are reset with
 * the form. A component also has them as custom states for CSS (`:state(touched)`, `:state(dirty)`); a native field has
 * `:user-invalid` already. On the server there are no effects nor events: it does nothing there.
 *
 * @example
 * ```html
 * @import { FormControlDirective, minLength, required } from '@xaendar/forms'
 *
 * <input #name @@formControl(validators="{[required(), minLength(2)]}") name="name" />
 * <ex-rating-input #rating @@formControl name="rating" />
 * ```
 */
@Directive({
  selector: 'formControl'
})
export class FormControlDirective extends CustomDirective<HTMLElement> {
  /**
   * The validators of the field, as Angular's: each one receives its value and returns its errors by name with their
   * message, or `undefined` when the value passes. None by default.
   */
  @Property<InputSignal<readonly FormValidator[]>>(NO_FORM_VALIDATORS)
  public accessor validators!: InputSignal<readonly FormValidator[]>;
  /**
   * Whether the user has not left the field after focusing it since the form was reset: Angular's `untouched`.
   */
  public readonly untouched: ReadonlySignal<boolean>;
  /**
   * Whether the user has not changed the value since the form was reset: Angular's `pristine`. The user changes it with
   * an `input` or a `change` event on the field; a value written by the code of the application does not count, and a
   * value changed back is dirty all the same.
   */
  public readonly pristine: ReadonlySignal<boolean>;
  /**
   * Whether the field has no error: Angular's `valid`.
   */
  public readonly valid: ReadonlySignal<boolean>;
  /**
   * Every error of the field: the one of the constraints of a native field or the ones of the validators of a
   * component first, then the ones of `validators`, each by name with its message; none when the value passes. The
   * browser shows the message of the first one only.
   */
  public readonly errors: ReadonlySignal<readonly FormError[]>;
  /**
   * The signal behind `untouched`.
   */
  private readonly _untouched = signal(true);
  /**
   * The signal behind `pristine`.
   */
  private readonly _pristine = signal(true);
  /**
   * The signal behind `valid`.
   */
  private readonly _valid = signal(true);
  /**
   * The signal behind `errors`.
   */
  private readonly _errors = signal<readonly FormError[]>(NO_FORM_ERRORS);
  /**
   * The value of a native field, read on its `input` and `change` events and when the form is reset: a native field has
   * no signal of its own.
   */
  private readonly _value = signal<unknown>(undefined);
  /**
   * The native field the directive is applied to, `null` for a component.
   */
  private _field: NativeFormField | null = null;
  /**
   * The bridge of the component the directive is applied to, `null` for a native field.
   */
  private _bridge: FormAssociatedDirective | null = null;
  /**
   * The form holding the field when the directive started, whose reset makes the field untouched and pristine.
   */
  private _form: HTMLFormElement | null = null;
  /**
   * Listens to the reset of the form: the form fires `reset` before resetting its fields, so the field is read once the
   * reset is done.
   */
  private readonly _onReset = (): void => queueMicrotask(() => this._reset());

  /**
   * Creates the directive, exposing the state signals without their `set` (see `Signal.asReadonly`): the ones the
   * directive writes stay private.
   */
  constructor() {
    super();
    this.untouched = this._untouched.asReadonly();
    this.pristine = this._pristine.asReadonly();
    this.valid = this._valid.asReadonly();
    this.errors = this._errors.asReadonly();
  }

  /**
   * Starts following the validity of the field: a component through its `FormAssociatedDirective`, a native field
   * through its own validity, and listens to the reset of its form.
   *
   * @throws When the element is neither a native field nor a component declaring `FormAssociatedDirective`.
   */
  public onInit(): void {
    const element = this.element;
    const bridge = element instanceof CustomElement ? element.hostDirectives.get(FormAssociatedDirective) : undefined;
    if (bridge) {
      this._bridge = bridge;
      this._form = bridge.internals?.form ?? null;
      this.effect(() => this._validateComponent(bridge));
    } else if (isNativeFormField(element)) {
      this._field = element;
      this._form = element.form;
      this._value.set(readNativeValue(element));
      this.effect(() => this._validateNative(element));
    } else {
      throw new Error(`FormControlDirective is applied to <${element.localName}>, which is neither a native field nor a component declaring FormAssociatedDirective among its host directives`);
    }

    this._form?.addEventListener('reset', this._onReset);
  }

  /**
   * Marks the field touched when the user leaves it, as Angular does on `blur`: not when the form is submitted, nor when
   * it finds the field invalid, which a silent `checkValidity()` also does.
   */
  @HostListener('focusout')
  private _touch(): void {
    this._setTouched(true);
  }

  /**
   * Marks the field dirty when the user changes the value, and reads the value of a native field: a native field
   * dispatches `input` and `change` for it, also when the user writes what the field already holds, as pasting the same
   * text does; a component dispatches them itself.
   */
  @HostListener('change')
  @HostListener('input')
  private _edit(): void {
    this._setDirty(true);
    if (this._field) {
      this._value.set(readNativeValue(this._field));
    }
  }

  /**
   * Makes the field untouched and pristine after the reset of its form, reading the value a native field went back to.
   */
  private _reset(): void {
    this._setTouched(false);
    this._setDirty(false);
    if (this._field) {
      this._value.set(readNativeValue(this._field));
    }
  }

  /**
   * Validates a native field: its own constraints, then the validators for its value, whose first error becomes its
   * custom error.
   *
   * @param field - The native field.
   */
  private _validateNative(field: NativeFormField): void {
    const native = readNativeErrors(field);
    const own = findFormErrors(this.validators(), this._value());
    field.setCustomValidity(own.length ? own[0].message : '');
    this._setErrors(joinFormErrors(native, own));
  }

  /**
   * Validates a component: the validators for the value it gives the form, whose errors join its own ones in its
   * validity, after its own ones.
   *
   * @param bridge - The `FormAssociatedDirective` of the component.
   */
  private _validateComponent(bridge: FormAssociatedDirective): void {
    const own = findFormErrors(this.validators(), bridge.source?.());
    bridge.setCustomErrors(own);
    this._setErrors(joinFormErrors(bridge.errors(), own));
  }

  /**
   * Sets the errors of the field, and whether it is valid.
   *
   * @param errors - The errors.
   */
  private _setErrors(errors: readonly FormError[]): void {
    this._errors.set(errors);
    this._valid.set(errors.length === 0);
  }

  /**
   * Sets whether the field is touched, and the `touched` state of a component.
   *
   * @param touched - Whether it is touched.
   */
  private _setTouched(touched: boolean): void {
    this._untouched.set(!touched);
    this._writeState('touched', touched);
  }

  /**
   * Sets whether the field is dirty, and the `dirty` state of a component.
   *
   * @param dirty - Whether it is dirty.
   */
  private _setDirty(dirty: boolean): void {
    this._pristine.set(!dirty);
    this._writeState('dirty', dirty);
  }

  /**
   * Writes a custom state of a component, where the DOM has `ElementInternals`: a native field has none.
   *
   * @param state - The name of the state.
   * @param on - Whether the element has it.
   */
  private _writeState(state: string, on: boolean): void {
    const internals = this._bridge?.internals;
    if (internals) {
      writeState(internals, state, on);
    }
  }

  /**
   * Stops listening to the form, and removes the errors the directive gave the field.
   */
  public onDestroy(): void {
    this._form?.removeEventListener('reset', this._onReset);
    this._form = null;
    this._field?.setCustomValidity('');
    this._bridge?.setCustomErrors(NO_FORM_ERRORS);
  }
}
