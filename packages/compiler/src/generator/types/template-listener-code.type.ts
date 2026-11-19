/**
 * A listener of an element being generated, before its handler is declared: the listener of one event binding, or of
 * the key events making the same call it joins (see `mapEvents`).
 */
export type TemplateListenerCode = {
  /**
   * The event listened to: `keydown` for `(keydown.enter)`.
   */
  event: string;
  /**
   * The call the handler makes, resolved: `this.save()`.
   */
  call: string;
  /**
   * The part of the name of the handler after `on_`, the name of the binding, followed by the keys of the key events
   * joining it: `keydown_enter_escape`.
   */
  role: string;
  /**
   * Whether the call reads `$event`, whole or in part.
   */
  readsEvent: boolean;
  /**
   * The tests of the keys the handler makes the call for, one per key event (`_isKey($event, 'enter', 0)`): left out for
   * a listener without filter.
   */
  keys?: string[];
};
