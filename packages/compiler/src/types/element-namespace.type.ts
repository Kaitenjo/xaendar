/**
 * The namespace an element of a template is created in: HTML, SVG (an `<svg>` and its descendants) or MathML (a `<math>`
 * and its descendants). It decides the factory creating the element and the interfaces typing it and its events.
 */
export type ElementNamespace = 'html' | 'svg' | 'mathml';
