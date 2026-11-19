import { defineQtyPicker } from '@xaendar-demo/qty-picker';

/*
  The global script of the application: Stencil runs it, and awaits what it returns, before bootstrapping any
  of its components. The element is therefore defined before `demo-app` renders the tag, and a tag that is not
  defined yet stays an empty unknown element until its definition arrives.

  Nothing here may carry a type annotation: Stencil parses this one file as plain JavaScript before transpiling
  it (`appDataPlugin`), so a `: Promise<void>` on the default export fails the build with "Expected '{', got
  ':'". The types are inferred instead.
*/

/**
 * Resolves once `<ex-qty-picker>` is defined and can be created.
 */
export const qtyPickerReady = defineQtyPicker();

/**
 * Hands Stencil the definition of the elements the application does not own.
 *
 * @returns A promise resolved once `<ex-qty-picker>` is defined.
 */
export default function defineElements() {
  return qtyPickerReady;
}
