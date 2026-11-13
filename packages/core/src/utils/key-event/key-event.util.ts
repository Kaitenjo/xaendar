import { KEY_MODIFIERS } from '@xaendar/common';

/**
 * Tells whether a keyboard event is the one a listener of a key event is filtered by (`(keydown.enter)`,
 * `@HostListener('document:keydown.escape')`, see `parseKeyEvent` of `@xaendar/common`): the key pressed, read from
 * `event.key`, or from `event.code` for a filter by code, in lowercase, `' '` read as `space` and `'.'` as `dot`, is the
 * key of the filter, and the modifiers pressed are exactly the ones of the filter, but the one that is the key itself
 * (`keydown.shift`). An event without key, such as the `keydown` Chrome dispatches when it autofills a field, matches
 * no filter.
 *
 * N.B. Deliberate, to save memory: the compiler writes the filter into the handler of the template, a function of the
 * module shared by every element (`if (_isKey($event, 'enter', 0)) this.save();`), so that a filtered listener costs
 * what any other listener costs. Do not keep the filter in the listener.
 *
 * @param event - The event.
 * @param key - The key of the filter, in lowercase.
 * @param modifiers - The modifiers of the filter, the bits of `KEY_MODIFIERS`.
 * @param code - Whether the key is matched against the code of the key pressed.
 * @returns `true` if the event is the one of the filter, `false` otherwise.
 */
export function _isKey(event: KeyboardEvent, key: string, modifiers: number, code?: boolean): boolean {
  const pressed = code ? event.code : event.key;
  if (!pressed) {
    return false;
  }

  const read = pressed === ' ' ? 'space' : pressed === '.' ? 'dot' : pressed.toLowerCase();
  return read === key && pressedModifiers(event, key) === modifiers;
}

/**
 * Reads the modifiers pressed during a keyboard event, but the one that is the key of the filter itself.
 *
 * @param event - The event.
 * @param key - The key of the filter.
 * @returns The bits of `KEY_MODIFIERS` of the modifiers pressed.
 */
function pressedModifiers(event: KeyboardEvent, key: string): number {
  let modifiers = event.altKey && key !== 'alt' ? KEY_MODIFIERS.alt : 0;
  if (event.ctrlKey && key !== 'control') {
    modifiers |= KEY_MODIFIERS.control;
  }

  if (event.metaKey && key !== 'meta') {
    modifiers |= KEY_MODIFIERS.meta;
  }

  if (event.shiftKey && key !== 'shift') {
    modifiers |= KEY_MODIFIERS.shift;
  }

  return modifiers;
}
