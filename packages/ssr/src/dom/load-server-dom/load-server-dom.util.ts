import { ServerCustomElementRegistry } from '../server-custom-element-registry/server-custom-element-registry';
import { ServerHTMLElement } from '../server-html-element/server-html-element';

/**
 * The classes of the native HTML elements, which a customized built-in element extends through `customElementOf`
 * (`customElementOf(HTMLButtonElement)`) when its module is evaluated.
 */
const HTML_ELEMENT_CLASSES = ['HTMLAnchorElement', 'HTMLAreaElement', 'HTMLAudioElement', 'HTMLBRElement', 'HTMLBaseElement', 'HTMLBodyElement', 'HTMLButtonElement', 'HTMLCanvasElement', 'HTMLDListElement', 'HTMLDataElement', 'HTMLDataListElement', 'HTMLDetailsElement', 'HTMLDialogElement', 'HTMLDivElement', 'HTMLEmbedElement', 'HTMLFieldSetElement', 'HTMLFormElement', 'HTMLHRElement', 'HTMLHeadElement', 'HTMLHeadingElement', 'HTMLHtmlElement', 'HTMLIFrameElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLLIElement', 'HTMLLabelElement', 'HTMLLegendElement', 'HTMLLinkElement', 'HTMLMapElement', 'HTMLMenuElement', 'HTMLMetaElement', 'HTMLMeterElement', 'HTMLModElement', 'HTMLOListElement', 'HTMLObjectElement', 'HTMLOptGroupElement', 'HTMLOptionElement', 'HTMLOutputElement', 'HTMLParagraphElement', 'HTMLPictureElement', 'HTMLPreElement', 'HTMLProgressElement', 'HTMLQuoteElement', 'HTMLScriptElement', 'HTMLSelectElement', 'HTMLSlotElement', 'HTMLSourceElement', 'HTMLSpanElement', 'HTMLStyleElement', 'HTMLTableCaptionElement', 'HTMLTableCellElement', 'HTMLTableColElement', 'HTMLTableElement', 'HTMLTableRowElement', 'HTMLTableSectionElement', 'HTMLTemplateElement', 'HTMLTextAreaElement', 'HTMLTimeElement', 'HTMLTitleElement', 'HTMLTrackElement', 'HTMLUListElement', 'HTMLVideoElement'];

/**
 * Installs the server DOM: the globals `HTMLElement` and `customElements` the modules of the components need when they
 * are evaluated, since a component extends `HTMLElement` and `@WebComponent` defines it in `customElements`, and the
 * classes of the native HTML elements (`HTMLButtonElement`…), which a customized built-in element extends through
 * `customElementOf`: on the server they are all `HTMLElement`, whose `customElementOf` is `CustomElement`. A global
 * already there, such as the one of a browser or of a DOM emulated by the tests, is kept.
 *
 * It must run before the modules of `@xaendar/core` and of the components are evaluated: the entry of the server calls
 * it first, and imports them afterwards, as it does with `loadSignals()`.
 *
 * @example
 * ```ts
 * import { loadSignals } from '@xaendar/signals';
 * import { loadServerDom } from '@xaendar/ssr/dom';
 *
 * loadSignals();
 * loadServerDom();
 *
 * const { renderToString } = await import('@xaendar/ssr');
 * const { AppRootComponent } = await import('./app-root/app-root.xd.component');
 * ```
 */
export function loadServerDom(): void {
  globalThis.customElements ??= new ServerCustomElementRegistry() as unknown as CustomElementRegistry;
  globalThis.HTMLElement ??= ServerHTMLElement as unknown as typeof HTMLElement;
  for (let i = 0; i < HTML_ELEMENT_CLASSES.length; i++) {
    if (Reflect.get(globalThis, HTML_ELEMENT_CLASSES[i]) === undefined) {
      Reflect.set(globalThis, HTML_ELEMENT_CLASSES[i], globalThis.HTMLElement);
    }
  }
}
