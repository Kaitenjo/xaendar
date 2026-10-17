import { describe, expect, it } from 'vitest';
import { assertRenderTarget } from './render-target.utils';

const span = { start: 8, end: 11 };

describe('assertRenderTarget', () => {
  it('accepts a template creating its content in the namespace of the @render', () => {
    expect(() => assertRenderTarget('row', span, 'svg', 'svg')).not.toThrow();
  });

  it('throws for a name not referring to a template, pointing to it', () => {
    expect(() => assertRenderTarget('row', span, undefined, 'html')).toThrow(new Error('"row" is not a template visible here: declare it with <template #row(…)> in this scope or in an enclosing one', { cause: span }));
  });

  it.each([
    ['html', 'svg', 'HTML', 'SVG'],
    ['mathml', 'html', 'MathML', 'HTML'],
    ['svg', 'mathml', 'SVG', 'MathML']
  ] as const)('throws for a template declared among %s elements rendered among %s elements', (templateNamespace, namespace, templateName, name) => {
    expect(() => assertRenderTarget('row', span, templateNamespace, namespace)).toThrow(`Template "row" is declared among ${templateName} elements, and its content cannot be rendered among ${name} elements: declare it in the namespace it is rendered in`);
  });
});
