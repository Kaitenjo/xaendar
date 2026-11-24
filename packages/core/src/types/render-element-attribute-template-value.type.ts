import type { RenderElementAttribute } from './render-element-attribute.type';

/**
 * An attribute or an input whose value is an expression of the template, not a static text: the attribute the setters
 * evaluating the expression receive (`_setExpressionProperty`, `_setExpressionInput`, `_setExpressionExposedInput`).
 */
export type RenderElementAttributeTemplateValue = Omit<RenderElementAttribute, 'value'> & { value: Exclude<RenderElementAttribute['value'], string> };
