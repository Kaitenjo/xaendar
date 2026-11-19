/**
 * The namespace an element of a template is created in, other than HTML, as the compiler writes it in the constant of
 * the element (see `RenderElement`): `1` for SVG (an `<svg>` and its descendants), `2` for MathML (a `<math>` and its
 * descendants). An HTML element, nearly every element, leaves it out.
 */
export type RenderElementNamespace = 1 | 2;
