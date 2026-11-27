import { CustomDirective, Directive } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import type { ReadonlySignal } from '@xaendar/core/signals';
import type { FormError } from '../../types/form-error.type';
import type { FormValidator } from '../../types/form-validator.type';
import type { FormValueSource } from '../../types/form-value-source.type';
import type { FormValue } from '../../types/form-value.type';
import { findFormErrors, joinFormErrors, NO_FORM_ERRORS, NO_FORM_VALIDATORS, writeFormValidity } from '../../utils/form-control/form-control.utils';

/**
 * Makes a component a field of the form holding it, as the native ones are: its value goes with the form under the
 * `name` of the element, its validity blocks the submission, the reset of the form and a disabled `<fieldset>` reach it.
 * The bridge between a component and the forms of the browser, the form-associated custom elements: the part of a
 * `ControlValueAccessor` of Angular the browser asks for, nothing more.
 *
 * A host directive: declared in the `hostDirectives` of the `@WebComponent` of the component, it declares the form
 * callbacks the browser calls on a form-associated element, which makes the class form-associated and which the
 * component forwards to it. The component keeps it in a field, gives it its value and its own validators in `onInit`, as
 * a native field has its `required` or `minlength`, and reads `disabled`. The states and the validators of the code
 * using the component (touched, dirty, the errors of a form) are `FormControlDirective`'s, which that code applies, on
 * the component as on a native field. On the server there are no `ElementInternals` nor effects: it does nothing there.
 *
 * @example
 * ```ts
 * \@WebComponent({ selector: 'ex-rating-input', hostDirectives: [FormAssociatedDirective], templateUrl: './rating-input.html' })
 * export class RatingInputComponent extends CustomElement {
 *   \@Model(0)
 *   public accessor value!: ModelSignal<number>;
 *   public readonly form = this.hostDirectives.get(FormAssociatedDirective)!;
 *
 *   public onInit(): void {
 *     this.form.setValue(this.value, value => value ? String(value) : null);
 *     this.form.setValidators([value => value ? undefined : { valueMissing: 'Choose a rating.' }]);
 *   }
 * }
 * ```
 */
@Directive({
  selector: 'formAssociated'
})
export class FormAssociatedDirective extends CustomDirective<HTMLElement> {
  /**
   * Whether the form, a `<fieldset disabled>` holding the element or its own `disabled` attribute disables it, as
   * `formDisabledCallback` says: the template of the component binds it (`disabled="{form.disabled()}"`).
   */
  public readonly disabled: ReadonlySignal<boolean>;
  /**
   * The errors the validators of the component find, the ones of `setValidators`: its own constraints, as the
   * `required` of a native field. The errors of the code using the component join them through `setCustomErrors`.
   */
  public readonly errors: ReadonlySignal<readonly FormError[]>;
  /**
   * The signal behind `disabled`.
   */
  private readonly _disabled = signal(false);
  /**
   * The signal behind `errors`.
   */
  private readonly _errors = signal<readonly FormError[]>(NO_FORM_ERRORS);
  /**
   * The validators of the component.
   */
  private readonly _validators = signal<readonly FormValidator[]>(NO_FORM_VALIDATORS);
  /**
   * The errors the code using the component gives it, after its own ones (see `setCustomErrors`).
   */
  private readonly _customErrors = signal<readonly FormError[]>(NO_FORM_ERRORS);
  /**
   * Gives the element of the shadow root the browser shows the message on, if any.
   */
  private _anchor: (() => HTMLElement | undefined) | undefined = undefined;
  /**
   * The `ElementInternals` of the element, `undefined` until attached, `null` where the DOM has none.
   */
  private _internals: ElementInternals | null | undefined = undefined;
  /**
   * The signal whose value goes to the form, `null` until `setValue` is called, and again once the element is
   * disconnected, its effect disposed.
   */
  private _source: FormValueSource<unknown> | null = null;
  /**
   * The value of the signal when `setValue` was called, which the reset of the form writes back.
   */
  private _initial: unknown = undefined;
  /**
   * Whether the value is converted for the form: the restoration of the browser is then left to the component.
   */
  private _converts = false;

  /**
   * The `ElementInternals` of the element, attached once by the directive: the object of the browser itself, for what
   * the directive does not cover (`form`, `labels`, `states`, `role` and the ARIA properties). The component does not call
   * `attachInternals()`, which throws a second time. `null` on the server, whose DOM has none.
   *
   * @returns The `ElementInternals` of the element, or `null`.
   */
  public get internals(): ElementInternals | null {
    if (this._internals === undefined) {
      this._internals = this.element.attachInternals?.() ?? null;
    }

    return this._internals;
  }

  /**
   * The signal whose value goes to the form, the one given to {@link setValue}: `FormControlDirective` checks its value.
   *
   * @returns The signal, `null` before `setValue`.
   */
  public get source(): FormValueSource<unknown> | null {
    return this._source;
  }

  /**
   * Creates the directive, exposing its signals without their `set` (see `Signal.asReadonly`).
   */
  constructor() {
    super();
    this.disabled = this._disabled.asReadonly();
    this.errors = this._errors.asReadonly();
  }

  /**
   * Starts following the validity, once the component has given its value and its validators in its `onInit`: the
   * errors of its validators for its value, then the validity of the form, its own errors and the custom ones together.
   * Two effects, so that the code using the component, which reads `errors` and writes the custom errors, never runs the
   * one it depends on again.
   */
  public afterRender(): void {
    this.effect(() => this._errors.set(findFormErrors(this._validators(), this._source?.())));
    this.effect(() => this._writeValidity());
  }

  /**
   * Gives the form the value of a signal, a `signal` or a model, following it in an effect bound to the element
   * (`ElementInternals.setFormValue`): the form sends it under the `name` of the element, and `FormData` holds it. The
   * value the signal has now is the initial one, which the reset of the form writes back; the restoration of the browser
   * writes the value it gives back.
   *
   * A field has one value: call it once, in `onInit` of the component, as a two-way binding names its field once.
   * Connected again, the component calls it again, its effect having been disposed with it.
   *
   * @param source - The signal whose value goes to the form.
   * @param transform - Converts the value for the form, required when it is not a text, a `File`, a `FormData` or
   *   `null`.
   * @throws When the component already gives its form the value of a signal.
   */
  public setValue<Value extends FormValue>(source: FormValueSource<Value>): void;
  public setValue<Value>(source: FormValueSource<Value>, transform: (value: Value) => FormValue): void;
  public setValue<Value>(source: FormValueSource<Value>, transform?: (value: Value) => FormValue): void {
    if (this._source) {
      throw new Error('FormAssociatedDirective.setValue() was already called: a field gives its form the value of one signal, set once');
    }

    this._source = source as FormValueSource<unknown>;
    this._initial = untracked(source);
    this._converts = !!transform;
    this.effect(() => this._writeValue(source(), transform), { onCleanup: () => this._source = null });
  }

  /**
   * Sets the validators of the component, its own constraints, as a native field has `required` or `minlength`. Each
   * one receives the value of the signal of {@link setValue}, and returns its errors by name with their message, or
   * `undefined` when the value passes; the signals they read are followed. With errors, the element is `:invalid`,
   * blocks the submission of the form, answers `checkValidity()` and `reportValidity()`, and the browser shows the message
   * of the first one on the anchor.
   *
   * Each call replaces the validators set before, as Angular's `setValidators`; an empty list removes them.
   *
   * @param validators - The validators, in the order their messages are chosen; none removes the ones set before.
   * @param anchor - Returns the element of the shadow root the browser shows the message on, followed until it exists;
   *   the host when it returns `undefined` or is missing.
   */
  public setValidators(validators: readonly FormValidator[], anchor?: () => HTMLElement | undefined): void {
    this._anchor = anchor;
    this._validators.set(validators.length ? validators : NO_FORM_VALIDATORS);
  }

  /**
   * Sets the errors the code using the component finds, which join its own ones in the validity of the form, as
   * `setCustomValidity()` does for a native field: `FormControlDirective` gives the errors of its validators here.
   *
   * @param errors - The errors, none to remove them.
   */
  public setCustomErrors(errors: readonly FormError[]): void {
    this._customErrors.set(errors);
  }

  /**
   * Called when the browser disables or enables the element (the form, a `<fieldset disabled>`, its own `disabled`
   * attribute), forwarded by the component: sets the value {@link disabled} reads.
   *
   * @param disabled - Whether the element is disabled.
   */
  public formDisabledCallback(disabled: boolean): void {
    this._disabled.set(disabled);
  }

  /**
   * Called when the form is reset, forwarded by the component: writes back into the signal given to {@link setValue} the
   * value it had then. A component declaring its own `formResetCallback` calls this one.
   */
  public formResetCallback(): void {
    this._source?.set(this._initial);
  }

  /**
   * Called when the browser gives the element back a value, forwarded by the component: going back in the history to the
   * page (`'restore'`), or filling the form with what it remembers (`'autocomplete'`). Writes the value into the signal
   * given to {@link setValue} when it goes to the form as it is: a value converted for the form cannot be turned back
   * here, so a component converting it declares its own `formStateRestoreCallback`, converting the value back.
   *
   * @param state - The value the component gave the form, or the one the browser fills in.
   * @param _mode - Why the browser gives it back.
   */
  public formStateRestoreCallback(state: FormValue, _mode: 'autocomplete' | 'restore'): void {
    if (this._source && !this._converts) {
      this._source.set(state);
    }
  }

  /**
   * Gives the form the value, converted when asked.
   *
   * @param value - The value of the signal.
   * @param transform - The conversion of the value, if any.
   */
  private _writeValue(value: unknown, transform: ((value: never) => FormValue) | undefined): void {
    this.internals?.setFormValue(transform ? transform(value as never) : value as FormValue);
  }

  /**
   * Gives the form the validity of the component, its own errors then the custom ones, where the DOM has
   * `ElementInternals`. Reads the validators too, so that a new anchor given with them is taken.
   */
  private _writeValidity(): void {
    this._validators();
    const errors = joinFormErrors(this._errors(), this._customErrors());
    const anchor = this._anchor?.();
    const internals = this.internals;
    if (internals) {
      writeFormValidity(internals, errors, anchor);
    }
  }
}
