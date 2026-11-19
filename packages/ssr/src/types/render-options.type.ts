/**
 * The options of `renderToString`.
 */
export type RenderOptions = {
  /**
   * The transfer state of the page: values the server gives the browser, by key, such as the data the entry fetched to
   * render the page, so that the browser starts from them without fetching them again. The components read them with
   * `getTransferState(key)` on both sides. They are written into the page as JSON, which carries `undefined`, `NaN`,
   * `±Infinity`, a `bigint`, a `Date`, a `Map` and a `Set` too.
   */
  readonly state?: Readonly<Record<string, unknown>>;
  /**
   * The nonce of the `Content-Security-Policy` of the response, written on the script of the event contract, which a
   * strict policy would block as any inline script. It must be a new one for each response, the same of the header.
   */
  readonly nonce?: string;
};
