/**
 * Name of the global DOM interface mapping the names of the native events of an element to their type,
 * which depends on the namespace the element is created in: HTML, SVG (inside an `<svg>`) or MathML (inside a `<math>`).
 */
export type ElementEventMap = 'HTMLElementEventMap' | 'SVGElementEventMap' | 'MathMLElementEventMap';
