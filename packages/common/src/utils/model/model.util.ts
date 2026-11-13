/**
 * The suffix of the event a model dispatches when it changes its value, after the name it is bound with: `valueChange`
 * for the model `value`. Two-way bindings (`[(value)]="…"`) listen to it.
 */
export const MODEL_CHANGE_SUFFIX = 'Change';

/**
 * Gets the name of the event a model dispatches when it changes its value.
 *
 * @param name - The name the model is bound with: its alias, when it declares one, else the name of its property.
 * @returns The name of the event, e.g. `valueChange` for `value`.
 */
export function toModelChangeEvent(name: string): string {
  return `${name}${MODEL_CHANGE_SUFFIX}`;
}

/**
 * Gets the name of the model an event of change belongs to, the inverse of {@link toModelChangeEvent}.
 *
 * @param event - The name of the event.
 * @returns The name the model is bound with, e.g. `value` for `valueChange`, `undefined` for a name not ending with
 *   {@link MODEL_CHANGE_SUFFIX} or made of it alone.
 */
export function toModelName(event: string): string | undefined {
  return event.length > MODEL_CHANGE_SUFFIX.length && event.endsWith(MODEL_CHANGE_SUFFIX) ? event.slice(0, -MODEL_CHANGE_SUFFIX.length) : undefined;
}
