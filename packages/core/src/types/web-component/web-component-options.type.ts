import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { HostDirectiveOptions } from './host-directive-options.type';
import type { ShadowHostTagName } from './shadow-host-tag-name.type';
import type { ShadowRootOptions } from './shadow-root-options.type';
import type { WebComponentSsrOptions } from './web-component-ssr-options.type';

/**
 * Configuration object accepted by the `@WebComponent` decorator.
 *
 * An autonomous custom element (`<my-card>`) renders the template of `templateUrl` into its shadow root. A customized
 * built-in element (`extends`, `<button is="my-button">`) extends a native element, whose class its own extends through
 * `customElementOf`: it renders a template only when its tag accepts a shadow root (see {@link ShadowHostTagName}), and
 * otherwise adds its inputs, its events, its host bindings and its host directives to the native element, whose content
 * is the one its tag holds.
 */
export type WebComponentOptions = {
  /**
   * The custom element selector used to register the component in the browser: the tag of an autonomous custom element,
   * the `is` attribute of a customized built-in element.
   * A custom element name, as a class, can be defined only once: it must be unique across every component.
   */
  selector: string,
  /**
   * The custom directives applied to every instance of the component, on the component element itself. Each one is either the
   * class of the directive, or a {@link HostDirectiveOptions} also exposing its inputs and outputs on the component.
   * The instances are reached through `hostDirectives` of the component.
   */
  hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>,
  /**
   * How the component behaves when the page is rendered on the server.
   */
  ssr?: WebComponentSsrOptions
} & ({
  /**
   * Left out by an autonomous custom element.
   */
  extends?: undefined,
  /**
   * Optional path to the component's stylesheet, relative to the component file, or the paths of its stylesheets,
   * adopted in their order after the styles of the project (`styles` of `xaendar.json`): each file is one stylesheet,
   * shared by every component listing it.
   */
  styleUrl?: string | readonly string[],
  /**
   * Path to the component's HTML template, relative to the component file.
   */
  templateUrl: string,
  /**
   * The options of the shadow root the template renders into, as `attachShadow` takes them, `mode` apart: `open`.
   * `delegatesFocus` moves the focus the element gets to the first focusable element of its template, and matches
   * `:focus` on it while that element has the focus; `slotAssignment: 'manual'` leaves the children unassigned until
   * the component assigns them (`slot.assign()`), which on a page rendered on the server happens only once the component
   * hydrates; `serializable` and `clonable` keep the shadow root in `getHTML({ serializableShadowRoots: true })` and in
   * `cloneNode()`.
   */
  shadowRoot?: ShadowRootOptions
} | {
  /**
   * The tag of the native element a customized built-in element extends, a tag accepting a shadow root: the class
   * extends `customElementOf` of the class of that tag (`HTMLElement` itself for `article`, `aside`, `footer`, `header`,
   * `main`, `nav` and `section`, whose class is `CustomElement`), and templates write it `<div is="my-panel">`.
   */
  extends: ShadowHostTagName,
  /**
   * Optional path to the component's stylesheet, relative to the component file, or the paths of its stylesheets: they
   * style the shadow root of the template, which they need.
   */
  styleUrl?: string | readonly string[],
  /**
   * Optional path to the component's HTML template, relative to the component file, rendered into the shadow root of the
   * element: without it, the element shows the content its tag holds.
   */
  templateUrl?: string,
  /**
   * The options of the shadow root the template renders into, as `attachShadow` takes them, `mode` apart: `open`. They
   * need the template.
   */
  shadowRoot?: ShadowRootOptions
} | {
  /**
   * The tag of the native element a customized built-in element extends, a tag accepting no shadow root: the class
   * extends `customElementOf` of the class of that tag (`customElementOf(HTMLButtonElement)` for `button`), and
   * templates write it `<button is="my-button">`.
   */
  extends: Exclude<keyof HTMLElementTagNameMap, ShadowHostTagName>,
  /**
   * Left out: the element has no shadow root to style.
   */
  styleUrl?: undefined,
  /**
   * Left out: the element has no shadow root to render a template into, and shows the content its tag holds.
   */
  templateUrl?: undefined,
  /**
   * Left out: the element has no shadow root.
   */
  shadowRoot?: undefined
});
