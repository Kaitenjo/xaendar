import { CustomDirective, Directive, HostListener } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import type { ReadonlySignal } from '@xaendar/core/signals';
import type { NoArgsVoidFunction } from '@xaendar/types';
import type { FormValidator } from '../../types/form-validator.type';
import type { FormValueSource } from '../../types/form-value-source.type';
import type { FormValue } from '../../types/form-value.type';
import { findFormErrors, writeFormValidity, writeState } from '../../utils/form-control/form-control.utils';

/**
 * Makes a component a control of the form holding it, as the native fields are: its value goes with the form under
 * the `name` of the element, its validity blocks the submission, the reset of the form and a disabled `<fieldset>`
 * reach it. The equivalent of a `ControlValueAccessor` of Angular, on the form-associated custom elements of the
 * browser.
 *
 * A host directive: declared in the `hostDirectives` of the `@WebComponent` of the component, it declares the form
 * callbacks the browser calls on a form-associated element, which makes the class form-associated and which the
 * component forwards to it. The component keeps it in a field, and gives it its value and its validators in `onInit`.
 *
 * The states are read-only signals, which an effect or a template follows: `untouched`, `pristine`, `valid` and
 * `disabled`; their opposites are the negation (`!control.untouched()`). The control is touched when the user leaves the
 * element (`focusout`) or the form finds it invalid, and dirty as soon as the user changes its value: a `input` or
 * `change` event on the element, which a control dispatches as a native one does, whether the value ends up different or
 * not. Both are reset by the reset of the form, and are also custom states of the element for CSS (`:state(touched)`,
 * `:state(dirty)`). On the server there are no `ElementInternals` nor effects: it does nothing there.
 *
 * @example
 * ```ts
 * \@WebComponent({ selector: 'ex-rating-input', hostDirectives: [FormControlDirective], templateUrl: './rating-input.html' })
 * export class RatingInputComponent extends CustomElement {
 *   \@Model(0)
 *   public accessor value!: ModelSignal<number>;
 *   public readonly control = this.hostDirectives.get(FormControlDirective)!;
 *
 *   public onInit(): void {
 *     this.control.setValue(this.value, value => value ? String(value) : null);
 *     this.control.setValidators([() => this.value() ? undefined : { valueMissing: 'Choose a rating.' }]);
 *   }
 * }
 * ```
 */
@Directive({
  selector: 'formControl'
})
export class FormControlDirective extends CustomDirective<HTMLElement> {
  /**
   * Whether the user has not left the element after focusing it, nor has the form found it invalid since it was reset:
   * Angular's `untouched`. The element has the custom state `touched` meanwhile, `:state(touched)` in CSS
   * (`:host(:state(touched):invalid)`).
   */
  public readonly untouched: ReadonlySignal<boolean>;
  /**
   * Whether the user has not changed the value since the control was reset: Angular's `pristine`. The user changes it
   * with an `input` or a `change` event on the element, as a native control dispatches them; a value written by the code
   * of the application does not count, and a value changed back is dirty all the same. The element has the custom state
   * `dirty` meanwhile, `:state(dirty)` in CSS.
   */
  public readonly pristine: ReadonlySignal<boolean>;
  /**
   * Whether the validators find no error, following the signals they read: Angular's `valid`. The browser's own
   * validity is `:valid` and `:invalid`, and `internals.validity`.
   */
  public readonly valid: ReadonlySignal<boolean>;
  /**
   * Whether the form, a `<fieldset disabled>` holding the element or its own `disabled` attribute disables it, as
   * `formDisabledCallback` says: a template binds it (`disabled="{control.disabled()}"`).
   */
  public readonly disabled: ReadonlySignal<boolean>;
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
   * The signal behind `disabled`.
   */
  private readonly _disabled = signal(false);
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
   * Disposes the effect of the validators set by `setValidators`, `null` while none is set.
   */
  private _stopValidators: NoArgsVoidFunction | null = null;

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
   * Creates the directive, exposing the state signals without their `set` (see `Signal.asReadonly`): the ones the
   * directive writes stay private.
   */
  constructor() {
    super();
    this.untouched = this._untouched.asReadonly();
    this.pristine = this._pristine.asReadonly();
    this.valid = this._valid.asReadonly();
    this.disabled = this._disabled.asReadonly();
  }

  /**
   * Gives the form the value of a signal, a `signal` or a model, following it in an effect bound to the element
   * (`ElementInternals.setFormValue`): the form sends it under the `name` of the element, and `FormData` holds it. The
   * value the signal has now is the initial one: the control is dirty while its value differs, and the reset of the form
   * writes it back; the restoration of the browser writes the value it gives back.
   *
   * A control has one value: call it once, in `onInit` of the component, as a two-way binding names its field once.
   * Connected again, the component calls it again, its effect having been disposed with it.
   *
   * @param source - The signal whose value goes to the form.
   * @param transform - Converts the value for the form, required when it is not a text, a `File`, a `FormData` or
   *   `null`.
   * @throws When the control already gives its form the value of a signal.
   */
  public setValue<Value extends FormValue>(source: FormValueSource<Value>): void;
  public setValue<Value>(source: FormValueSource<Value>, transform: (value: Value) => FormValue): void;
  public setValue<Value>(source: FormValueSource<Value>, transform?: (value: Value) => FormValue): void {
    if (this._source) {
      throw new Error('FormControlDirective.setValue() was already called: a control gives its form the value of one signal, set once');
    }

    this._source = source;
    this._initial = untracked(source);
    this._converts = !!transform;
    this.effect(() => this._writeValue(source(), transform), { onCleanup: () => this._source = null });
  }

  /**
   * Gives the form the validity computed by the validators, in an effect bound to the element following the signals
   * they read (`ElementInternals.setValidity`). Each validator returns its errors, as the flags of `ValidityState` each
   * with its message (`customError` for an error of its own), or `undefined` when the value passes. With errors, the
   * element is `:invalid`, blocks the submission of the form, answers `checkValidity()` and `reportValidity()`, and the
   * browser shows the message of the first one on the anchor; without, it is valid.
   *
   * Each call replaces the validators set before, as Angular's `setValidators`: a validator depending on a state reads
   * its signal and returns `undefined` when it does not apply, or the component sets the list again; an empty list
   * removes them, and the control is valid.
   *
   * @param validators - The validators, in the order their messages are chosen; none removes the ones set before.
   * @param anchor - Returns the element of the shadow root the browser shows the message on, followed until it exists;
   *   the host when it returns `undefined` or is missing.
   */
  public setValidators(validators: readonly FormValidator[], anchor?: () => HTMLElement | undefined): void {
    this._stopValidators?.();
    validators.length
      ? this._stopValidators = this.effect(() => this._writeValidity(validators, anchor?.()), { onCleanup: () => this._stopValidators = null })
      : this._writeValidity(validators, undefined);
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
   * value it had then, and makes the control untouched and pristine. A component declaring its own `formResetCallback`
   * calls this one.
   */
  public formResetCallback(): void {
    this._source?.set(this._initial);
    this._setTouched(false);
    this._setDirty(false);
  }

  /**
   * Called when the browser gives the element back a value, forwarded by the component: going back in the history to the
   * page (`'restore'`), or filling the form with what it remembers (`'autocomplete'`). Writes the value into the signal
   * given to {@link setValue} when it goes to the form as it is: a value converted for the form cannot be turned back
   * here, so a component converting it declares its own `formStateRestoreCallback`, converting the value back.
   *
   * @param state - The value the control gave the form, or the one the browser fills in.
   * @param _mode - Why the browser gives it back.
   */
  public formStateRestoreCallback(state: FormValue, _mode: 'autocomplete' | 'restore'): void {
    if (this._source && !this._converts) {
      this._source.set(state);
    }
  }

  /**
   * Marks the control touched when the user leaves the element, or when the form finds it invalid, on a submission or
   * `checkValidity()`.
   */
  @HostListener('focusout')
  @HostListener('invalid')
  private _touch(): void {
    this._setTouched(true);
  }

  /**
   * Marks the control dirty when the user changes the value: a native control dispatches `input` and `change` for it,
   * also when the user writes what the control already holds, as pasting the same text does, which a signal would not
   * see. The `input` of a native field inside the shadow root crosses it, the `change` does not: the component dispatches
   * it itself.
   */
  @HostListener('change')
  @HostListener('input')
  private _edit(): void {
    this._setDirty(true);
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
   * Computes the errors of the validators, which `valid` follows, and gives them to the form where the DOM has
   * `ElementInternals`.
   *
   * @param validators - The validators.
   * @param anchor - The element the browser shows the message on, `undefined` for the host.
   */
  private _writeValidity(validators: readonly FormValidator[], anchor: HTMLElement | undefined): void {
    const errors = findFormErrors(validators);
    this._valid.set(!!errors);
    const internals = this.internals;
    if (internals) {
      writeFormValidity(internals, errors, anchor);
    }
  }

  /**
   * Sets whether the control is touched, and the `touched` state of the element.
   *
   * @param touched - Whether it is touched.
   */
  private _setTouched(touched: boolean): void {
    this._untouched.set(!touched);
    this._writeState('touched', touched);
  }

  /**
   * Sets whether the control is dirty, and the `dirty` state of the element.
   *
   * @param dirty - Whether it is dirty.
   */
  private _setDirty(dirty: boolean): void {
    this._pristine.set(!dirty);
    this._writeState('dirty', dirty);
  }

  /**
   * Writes a custom state of the element, where the DOM has `ElementInternals`.
   *
   * @param state - The name of the state.
   * @param on - Whether the element has it.
   */
  private _writeState(state: string, on: boolean): void {
    const internals = this.internals;
    if (internals) {
      writeState(internals, state, on);
    }
  }
}
