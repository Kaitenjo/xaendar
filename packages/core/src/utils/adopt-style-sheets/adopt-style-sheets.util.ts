/**
 * Adopts the stylesheets of a component in its shadow root, first and in their order, keeping the ones other code adopted
 * there (the application, a directive), after them: adopted again at every render, the ones of the component are
 * recognized by identity and never doubled.
 *
 * @param root - The shadow root of the component.
 * @param own - The stylesheets of the component.
 */
export function adoptStyleSheets(root: ShadowRoot, own: readonly CSSStyleSheet[]): void {
  const current = root.adoptedStyleSheets;
  const foreign = current.length ? current.filter(sheet => !own.includes(sheet)) : current;
  root.adoptedStyleSheets = foreign.length ? own.concat(foreign) : own.slice();
}
