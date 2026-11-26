import type { Signal } from '../../signals/types/signal.type';
import type { FormValueSource } from './form-value-source.type';

/**
 * What a form-associated component keeps of its form (see `CustomElement.formValue`), created only for the classes
 * declaring `static formAssociated = true`.
 */
export type _FormAssociation = {
  /**
   * The `ElementInternals` of the element, `null` where the DOM has none, as on the server.
   */
  readonly internals: ElementInternals | null;
  /**
   * Whether the form, a `<fieldset>` or the `disabled` attribute disables the element, as `formDisabledCallback` says.
   */
  readonly disabled: Signal<boolean>;
  /**
   * The signal whose value goes to the form, `null` until `formValue` is called.
   */
  source: FormValueSource<unknown> | null;
  /**
   * The value of the signal when `formValue` was called, which the reset of the form writes back.
   */
  initial: unknown;
  /**
   * Whether the value is converted before going to the form: the restoration of the browser, which gives back the
   * converted value, is then left to the `formStateRestoreCallback` of the component.
   */
  converts: boolean;
};
