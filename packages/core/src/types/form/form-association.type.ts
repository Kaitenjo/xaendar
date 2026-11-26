import type { NoArgsVoidFunction } from '@xaendar/types';
import type { Signal } from '../../signals/types/signal.type';
import type { FormValueSource } from './form-value-source.type';

/**
 * What a form-associated component keeps of its form (see `CustomElement.setFormValue`), created only for the classes
 * whose `@WebComponent` declares `formAssociated: true`, or which declare the static `formAssociated` themselves. It is
 * also the listener of the events marking the component touched (see `handleEvent`).
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
   * Whether the user left the element after focusing it, or the form was submitted while it was invalid: `false` again
   * when the form is reset.
   */
  readonly touched: Signal<boolean>;
  /**
   * The signal whose value goes to the form, `null` until `setFormValue` is called, and again once the component is
   * disconnected, its effect disposed.
   */
  source: FormValueSource<unknown> | null;
  /**
   * The value of the signal when `setFormValue` was called: the component is dirty while its value differs, and the
   * reset of the form writes it back.
   */
  initial: unknown;
  /**
   * Whether the value is converted before going to the form: the restoration of the browser, which gives back the
   * converted value, is then left to the `formStateRestoreCallback` of the component.
   */
  converts: boolean;
  /**
   * Disposes the effect of the validators set by `setFormValidators`, `null` while none is set.
   */
  stopValidators: NoArgsVoidFunction | null;
  /**
   * Marks the component touched, on `focusout` and on `invalid` (see `markTouched`).
   */
  handleEvent(this: _FormAssociation): void;
};
