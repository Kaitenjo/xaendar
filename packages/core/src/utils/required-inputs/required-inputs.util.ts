import { INTERNAL_REQUIRED_INPUTS } from '../../costants';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';

/**
 * Ensures the code creating a component or applying a directive binds every input `@Property.required` declares, as
 * the type-check of the templates does for the templates.
 *
 * @param klass - The class of the component or of the directive.
 * @param bound - The names of the properties of the inputs bound as long as the component or the directive lives, if any.
 * @param binder - What binds the inputs, for the message of the error.
 * @throws When a required input is not among the ones bound.
 */
export function _assertRequiredInputs(klass: { name: string }, bound: ReadonlySet<string> | undefined, binder: string): void {
  const required = getWebComponentMetadata(klass)?.[INTERNAL_REQUIRED_INPUTS];
  if (!required?.size) {
    return;
  }

  for (const name of required) {
    if (!bound?.has(name)) {
      throw new Error(`The required input "${name}" of ${klass.name} is not bound by ${binder}`);
    }
  }
}
