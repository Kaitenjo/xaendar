import { describe, expect, it } from 'vitest';
import { getParametersType, getTemplateHelpers, PARAMETERS, RENDER, TEMPLATE } from './template-types.utils';

describe('getTemplateHelpers', () => {
  it('declares the type of a template, the type of its parameters in its content and the function checking a @render', () => {
    expect(getTemplateHelpers().map(({ text }) => text)).toEqual([
      `type ${TEMPLATE}<Params extends unknown[]> = { readonly __params: Params };`,
      `type ${PARAMETERS}<Values extends unknown[]> = { [Key in keyof Values]: import('@xaendar/core/signals').Computed<Values[Key]> };`,
      `declare function ${RENDER}<Params extends unknown[]>(template: ${TEMPLATE}<Params>): (...args: Params) => void;`
    ]);
  });
});

describe('getParametersType', () => {
  it('tells the types of the parameters of a template apart by its position', () => {
    expect(getParametersType({ span: { start: 42, end: 80 } })).toBe('__Params42');
  });
});
