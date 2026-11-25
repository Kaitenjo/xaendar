import { _SERVER_STYLE_ATTRIBUTE } from '../../costants';

/**
 * The selector of the elements of a tree whose inline style the server moved into the `<style>` of the tree: the
 * `<style>` holds the attribute too, and no template renders one.
 */
const STYLED_ELEMENTS = `[${_SERVER_STYLE_ATTRIBUTE}]:not(style)`;

/**
 * Moves into the inline style of the elements of a declarative shadow root the declarations the server wrote for them
 * into the `<style>` of the root (see `_SERVER_STYLE_ATTRIBUTE`), before the `<style>` is removed: the elements are then
 * the ones the server would have written with their `style` attribute, which the hydration adopts, writing only what
 * differs. All of them at once, the ones of a `@hydrate` and the elements of components waiting for a trigger included,
 * since the `<style>` goes with the hydration of the component. Written through the CSSOM, which a
 * `Content-Security-Policy` allows.
 *
 * @param root - The shadow root.
 * @param style - The `<style>` of the root, still in it.
 */
export function adoptServerStyles(root: ShadowRoot, style: HTMLStyleElement): void {
  const { sheet } = style;
  const elements = root.querySelectorAll(STYLED_ELEMENTS);
  for (let i = 0; i < elements.length; i++) {
    adoptServerStyle(elements[i], sheet);
  }
}

/**
 * Moves into the inline style of the element of a component no other component adopts, the root of a page or one a
 * static component renders, the declarations the server wrote for it (see {@link adoptServerStyles}): the `<style>`
 * right before the root of a page, or the one of the shadow root of the static component, which stays.
 *
 * @param element - The element of the component, hydrating.
 */
export function adoptHostServerStyle(element: Element): void {
  if (element.hasAttribute(_SERVER_STYLE_ATTRIBUTE)) {
    adoptServerStyle(element, findServerStyle(element)?.sheet ?? null);
  }
}

/**
 * Moves into the inline style of an element the declarations of its rule, the one at the index its attribute holds,
 * removing the attribute, so that the rule no longer applies to it: the bindings of the browser change the inline style
 * from then on. Without a rule, as when a `Content-Security-Policy` blocked the `<style>`, the element only loses the
 * attribute, and the hydration writes its style.
 *
 * @param element - The element.
 * @param sheet - The stylesheet of the `<style>` of its tree, `null` when the browser applied none.
 */
function adoptServerStyle(element: Element, sheet: CSSStyleSheet | null): void {
  const rule = sheet?.cssRules[Number(element.getAttribute(_SERVER_STYLE_ATTRIBUTE))] as CSSStyleRule | undefined;
  element.removeAttribute(_SERVER_STYLE_ATTRIBUTE);
  if (rule?.style.length) {
    // Every element a template renders, HTML, SVG or MathML, has the inline style of an HTMLElement
    (element as HTMLElement).style.cssText = rule.style.cssText;
  }
}

/**
 * Finds the `<style>` holding the rule of an element: among the first children of its shadow root, or the element right
 * before it, for the root of a page.
 *
 * @param element - The element.
 * @returns The `<style>`, `null` when there is none.
 */
function findServerStyle(element: Element): HTMLStyleElement | null {
  const root = element.getRootNode();
  const inShadowRoot = root instanceof ShadowRoot;
  let node = inShadowRoot ? root.firstElementChild : element.previousElementSibling;
  while (node?.localName === 'style') {
    if (node.hasAttribute(_SERVER_STYLE_ATTRIBUTE)) {
      return node as HTMLStyleElement;
    }

    node = inShadowRoot ? node.nextElementSibling : null;
  }

  return null;
}
