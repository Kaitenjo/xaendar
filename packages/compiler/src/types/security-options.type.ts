import type { UrlSanitization } from './url-sanitization.type';

/**
 * What the compiler checks in the bindings of a template that could run code from the values of the application: the
 * `security` of `xaendar.json`.
 */
export interface SecurityOptions {
  /**
   * How a URL bound to an attribute loading or opening it (`href="{ url() }"`) is checked (see `UrlSanitization`).
   * Defaults to `'off'`.
   */
  readonly urls?: UrlSanitization;
  /**
   * Whether binding a value to an attribute the browser runs is an error of the type-check: an event handler attribute
   * (`onclick="{ code }"`, any name starting with `on`) or the `srcdoc` of an `<iframe>`. The values written in the
   * template are allowed. Defaults to `true`.
   */
  readonly rejectUnsafeBindings?: boolean;
}
