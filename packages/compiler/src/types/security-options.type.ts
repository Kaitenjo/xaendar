import type { UrlSanitization } from './url-sanitization.type';

/**
 * How the values of the application that could run code are checked: the `security` of `xaendar.json`, set by the
 * project alone, which applies it to every component it renders, the ones of its libraries included (a library declares
 * none). The type-check of the templates of the project reads `rejectUnsafeBindings`; the build passes every option to
 * the runtime, which checks the URLs of the templates and of the `@HostAttribute`s, so that a component compiled in a
 * library follows the project using it.
 */
export interface SecurityOptions {
  /**
   * How a URL bound to an attribute loading or opening it (`href="{ url() }"`, the images of a `srcset`, the URLs of a
   * `ping`) is checked (see `UrlSanitization`): a URL running code (`javascript:`, `vbscript:`, a `data:` URL that is not
   * an image, an audio or a video) is written with a warning, or left out. Defaults to `'warn'`.
   */
  readonly urls?: UrlSanitization;
  /**
   * How a URL bound to an attribute loading a resource into the page (the `src` of an `<iframe>`, an `<embed>` or a
   * `<frame>`, the `data` and `codebase` of an `<object>`, the `href` of a `<link>` or of the `<base>`) is checked (see
   * `UrlSanitization`): an absolute URL whose origin is not one of `trustedOrigins` is written with a warning, or left
   * out; a relative URL loads from the application, and passes. Defaults to `'warn'`.
   */
  readonly resourceUrls?: UrlSanitization;
  /**
   * The origins the resources may be loaded from besides the one of the application, as `URL.origin` writes them
   * (`https://www.youtube-nocookie.com`). Defaults to none.
   */
  readonly trustedOrigins?: readonly string[];
  /**
   * Whether binding a value to an attribute the browser runs, or that would lift a restriction, is an error of the
   * type-check of the templates of the project, and of the runtime for a `@HostAttribute`: an event handler attribute (`onclick="{ code }"`, any name
   * starting with `on`), a `srcdoc`, the attributes restricting the page of an `<iframe>` (`sandbox`, `allow`…), the
   * `attributeName` of an SVG animation and the values of one animating an `href`, the `http-equiv` of a `<meta>` and the
   * `content` of a `<meta http-equiv="refresh">`. The values written in the template are allowed. Defaults to `true`; the templates of a library are
   * always checked, since they must work in any project.
   */
  readonly rejectUnsafeBindings?: boolean;
}
