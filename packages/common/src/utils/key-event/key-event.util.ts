import type { KeyEventFilter } from '../../types/key-event-filter.type';

/**
 * The modifiers a key event may name (`keydown.control.s`), each one a bit of the mask of `KeyEventFilter.modifiers`,
 * the same bits the runtime reads from the event: `altKey`, `ctrlKey`, `metaKey` and `shiftKey`.
 */
export const KEY_MODIFIERS = { alt: 1, control: 2, meta: 4, shift: 8 } as const;

/**
 * Reads the key a listener is filtered by from the name of its event, as Angular does: `keydown` or `keyup`, followed by
 * the modifiers, in any order, `code` to match the code of the key instead of the key it types, and the key, all of them
 * separated by dots (`keydown.enter`, `keyup.control.shift.z`, `keydown.code.keya`). The modifiers and the key are read in
 * lowercase, `esc` is `escape`, and the keys that cannot be written in the name are `space` and `dot`.
 *
 * @param name - The name of the event, as written in the template or given to `@HostListener`.
 * @returns The filter, `undefined` for the name of any other event, `keydown` alone included.
 * @throws If the name of a key event names no key, or names a modifier that does not exist, or twice.
 */
export function parseKeyEvent(name: string): KeyEventFilter | undefined {
  const dot = name.indexOf('.');
  const event = dot < 0 ? name : name.slice(0, dot);
  if (dot < 0 || (event !== 'keydown' && event !== 'keyup')) {
    return undefined;
  }

  const parts = name.slice(dot + 1).toLowerCase().split('.');
  const key = parts[parts.length - 1];
  if (!key) {
    throw new Error(`The key event "${name}" names no key: write it after the last dot, e.g. ${event}.enter`);
  }

  let modifiers = 0;
  let code = false;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const modifier = Object.hasOwn(KEY_MODIFIERS, part) ? KEY_MODIFIERS[part as keyof typeof KEY_MODIFIERS] : 0;
    if (!modifier && part !== 'code') {
      throw new Error(`"${part}" is not a modifier of the key event "${name}": alt, control, meta, shift or code`);
    }

    if (modifier ? modifiers & modifier : code) {
      throw new Error(`The key event "${name}" names "${part}" twice`);
    }

    modifiers |= modifier;
    code ||= !modifier;
  }

  const filter: KeyEventFilter = { event, key: key === 'esc' ? 'escape' : key, modifiers };
  return code ? Object.assign(filter, { code: true }) : filter;
}
