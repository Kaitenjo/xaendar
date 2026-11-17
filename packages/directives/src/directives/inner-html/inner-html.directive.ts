import type { Output } from '@xaendar/core';
import { CustomDirective, Directive, Event, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { HtmlContent } from '../../types/html-content.type';
import type { HtmlSanitizeReport } from '../../types/html-sanitize-report.type';
import type { HtmlSanitizerOptions } from '../../types/html-sanitizer-options.type';
import type { HtmlSanitizer } from '../../types/html-sanitizer.type';
import { renderHtml } from '../../utils/inner-html/inner-html.utils';

/**
 * Renders an HTML as the content of the element it is applied to, which an interpolation, writing text, cannot do: the
 * equivalent of `[innerHTML]` of Angular. The element holds nothing else: the content the template gives it is
 * replaced. The HTML is rendered again whenever it changes, and on the server it is written into the page.
 *
 * The HTML is sanitized by default, as Angular does (see `sanitizeHtml`): the elements, the attributes and the URLs that
 * can run code are removed. `options` changes what is kept, `sanitizer` replaces the sanitizer with one of the
 * application (DOMPurify), and an HTML trusted with `trustHtml` is rendered as it is. When something is removed, the
 * element dispatches `sanitized`, whose detail tells what.
 *
 * Where the browser supports Trusted Types, the HTML is written with the policy `xaendar#inner-html` once sanitized
 * here, with `xaendar#inner-html-unsafe` when trusted or sanitized by the application: a `Content-Security-Policy`
 * requiring Trusted Types lists the names it allows in its `trusted-types`.
 *
 * Apply it to an element that can hold the HTML: on a page rendered on the server, a `div` or a `ul` of the HTML would
 * close a `p` holding it, as the browser reads the page.
 *
 * @example
 * ```html
 * @import { InnerHtmlDirective } from '@xaendar/directives'
 *
 * <article @@innerHtml(html="{post().body}") />
 * <article @@innerHtml(html="{post().body}" options="{withImages}" (sanitized)="logRemoved($event.detail)") />
 * <span @@innerHtml(html="{icon}") />
 * ```
 */
@Directive({
  selector: 'innerHtml'
})
export class InnerHtmlDirective extends CustomDirective<HTMLElement> {
  /**
   * The HTML to render: a string, sanitized, an HTML trusted with `trustHtml`, rendered as it is, or nothing (`null`,
   * `undefined`, the default `''`), which empties the element.
   */
  @Property<InputSignal<HtmlContent>>('')
  public accessor html!: InputSignal<HtmlContent>;
  /**
   * What the sanitizer keeps besides, or in place of, what it keeps by default: read once for each object, so create it
   * once (a constant, a field).
   */
  @Property<InputSignal<HtmlSanitizerOptions | undefined>>(undefined)
  public accessor options!: InputSignal<HtmlSanitizerOptions | undefined>;
  /**
   * The sanitizer to use in place of the one of the directive, `options` aside: what it returns is rendered as it is.
   */
  @Property<InputSignal<HtmlSanitizer | undefined>>(undefined)
  public accessor sanitizer!: InputSignal<HtmlSanitizer | undefined>;
  /**
   * Dispatched when the sanitizer of the directive removes something from the HTML, with what it removed: in the
   * browser only.
   */
  @Event()
  public accessor sanitized!: Output<HtmlSanitizeReport>;

  /**
   * Starts rendering the HTML: on the server, where the effects do not run, it is written once, into the page; in the
   * browser the effect writes it, and again at each change.
   */
  public onInit(): void {
    typeof window === 'undefined' ? this._renderHtml() : this.effect(() => this._render());
  }

  /**
   * Renders the HTML, and reports what the sanitizer removed from it.
   */
  private _render(): void {
    const report = this._renderHtml();
    if (report) {
      this.sanitized.dispatch(report);
    }
  }

  /**
   * Renders the HTML into the specified element
   * @returns What the sanitizer of the directives removed, undefined when it removed nothing, or did not run.
   */
  private _renderHtml(): ReturnType<typeof renderHtml> {
    return renderHtml(this.element, this.html(), this.options(), this.sanitizer());
  }
}
