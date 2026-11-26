import { CustomDirective, Directive, HostListener } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import type { NoArgsVoidFunction } from '@xaendar/types';
import type { FormValidator } from '../../types/form-validator.type';
import type { FormValueSource } from '../../types/form-value-source.type';
import type { FormValue } from '../../types/form-value.type';
import { assertFormAssociated, writeFormValidity, writeState } from '../../utils/form-control/form-control.utils';

/**
 * Makes a component a control of the form holding it, as the native fields are: its value goes with the form under
 * the `name` of the element, its validity blocks the submission, the reset of the form and a disabled `<fieldset>`
 * reach it. The equivalent of a `ControlValueAccessor` of Angular, on the form-associated custom elements of the
 * browser.
 *
 * A host directive: declared in the `hostDirectives` of the `@WebComponent` of the component, it makes its class
 * form-associated (`formAssociated` of `@Directive`), and the component forwards it the form callbacks the browser
 * calls. The component keeps it in a field, and gives it its value and its validators in `onInit`. The states of
 * Angular are signals, each with its opposite (`touched`/`untouched`, `dirty`/`pristine`, `disabled`), and `touched`
 * and `dirty` are also custom states of the element for CSS (`:state(touched)`, `:state(dirty)`). On the server there
 * are no `ElementInternals` nor effects: it does nothing there.
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
  selector: 'formControl',
  formAssociated: true
})
export class FormControlDirective extends CustomDirective<HTMLElement> {
  /**
   * Whether the browser disables the element, as `formDisabledCallback` says.
   */
  private readonly _disabled = signal(false);
  /**
   * Whether the user left the element after focusing it, or the form found it invalid.
   */
  private readonly _touched = signal(false);
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
   * The value of the signal when `setValue` was called: the control is dirty while its value differs, and the reset of
   * the form writes it back.
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
   * Ensures the directive is a host directive of a form-associated component.
   *
   * @throws When it is applied from a template, to an element that is not form-associated.
   */
  public onInit(): void {
    assertFormAssociated(this.element);
  }

  /**
   * Tells whether the form, a `<fieldset disabled>` holding the element or its own `disabled` attribute disables it, read
   * from a signal: a template binds it (`disabled="{control.disabled()}"`).
   *
   * @returns `true` when the element is disabled.
   */
  public disabled(): boolean {
    return this._disabled();
  }

  /**
   * Tells whether the user left the element after focusing it (`focusout`), or the form found it invalid (a submission,
   * `checkValidity()`): Angular's `touched`, read from a signal. `false` again when the form is reset. The element has the
   * custom state `touched` meanwhile, `:state(touched)` in CSS (`:host(:state(touched):invalid)`).
   *
   * @returns `true` when the control is touched.
   */
  public touched(): boolean {
    return this._touched();
  }

  /**
   * The opposite of {@link touched}: Angular's `untouched`.
   *
   * @returns `true` while the control is not touched.
   */
  public untouched(): boolean {
    return !this._touched();
  }

  /**
   * Tells whether the value differs, by `Object.is`, from the one its signal had when given to {@link setValue},
   * following the signal: Angular's `dirty`. `false` again when the form is reset, which writes that value back. The
   * element has the custom state `dirty` meanwhile, `:state(dirty)` in CSS.
   *
   * @returns `true` when the value differs, always `false` before `setValue`.
   */
  public dirty(): boolean {
    const source = this._source;
    return source ? !Object.is(source(), this._initial) : false;
  }

  /**
   * The opposite of {@link dirty}: Angular's `pristine`.
   *
   * @returns `true` while the value is the initial one.
   */
  public pristine(): boolean {
    return !this.dirty();
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

    this._source = source as FormValueSource<unknown>;
    this._initial = untracked(source);
    this._converts = transform !== undefined;
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
    if (validators.length) {
      this._stopValidators = this.effect(() => this._writeValidity(validators, anchor?.()), { onCleanup: () => this._stopValidators = null });
    } else {
      this._writeValidity(validators, undefined);
    }
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
   * value it had then, and makes the control untouched. A component declaring its own `formResetCallback` calls this one.
   */
  public formResetCallback(): void {
    this._source?.set(this._initial);
    this._setTouched(false);
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
   * Marks the control touched when the user leaves the element.
   */
  @HostListener('focusout')
  private _leave(): void {
    this._setTouched(true);
  }

  /**
   * Marks the control touched when the form finds it invalid, on a submission or `checkValidity()`.
   */
  @HostListener('invalid')
  private _invalid(): void {
    this._setTouched(true);
  }

  /**
   * Gives the form the value, converted when asked, and writes the `dirty` state of the element.
   *
   * @param value - The value of the signal.
   * @param transform - The conversion of the value, if any.
   */
  private _writeValue(value: unknown, transform: ((value: never) => FormValue) | undefined): void {
    const internals = this.internals;
    if (internals) {
      internals.setFormValue(transform ? transform(value as never) : value as FormValue);
      writeState(internals, 'dirty', !Object.is(value, this._initial));
    }
  }

  /**
   * Gives the form the validity the validators compute, where the DOM has `ElementInternals`.
   *
   * @param validators - The validators.
   * @param anchor - The element the browser shows the message on, `undefined` for the host.
   */
  private _writeValidity(validators: readonly FormValidator[], anchor: HTMLElement | undefined): void {
    const internals = this.internals;
    if (internals) {
      writeFormValidity(internals, validators, anchor);
    }
  }

  /**
   * Sets whether the control is touched, and the `touched` state of the element.
   *
   * @param touched - Whether it is touched.
   */
  private _setTouched(touched: boolean): void {
    this._touched.set(touched);
    const internals = this.internals;
    if (internals) {
      writeState(internals, 'touched', touched);
    }
  }
}
