/**
 * The key a listener of a key event is filtered by, read from the name of the event (`keydown.enter`,
 * `keyup.control.shift.z`, `keydown.code.keya`): the listener is called only for the key named, with exactly the
 * modifiers named.
 */
export type KeyEventFilter = {
  /**
   * The event listened to: `keydown` or `keyup`.
   */
  readonly event: 'keydown' | 'keyup';
  /**
   * The key, in lowercase, as the runtime reads it from the event: `enter`, `escape`, `a`, `space` for `' '`, `dot` for
   * `'.'`, the code of the key with `code` (`keya`, `digit1`).
   */
  readonly key: string;
  /**
   * The modifiers that must be pressed, and no other one: the bits of `KEY_MODIFIERS` (`alt` 1, `control` 2, `meta` 4,
   * `shift` 8), `0` for none.
   */
  readonly modifiers: number;
  /**
   * Set when the key is matched against the code of the key pressed (`event.code`), its place on the keyboard, instead
   * of the key it types (`event.key`).
   */
  readonly code?: true;
};
