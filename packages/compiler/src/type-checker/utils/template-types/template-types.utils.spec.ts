import { describe, expect, it } from 'vitest';
import { getContentFunction, getLetValue, getParametersType, getTemplateHelpers, RENDER, TEMPLATE } from './template-types.utils';

describe('getTemplateHelpers', () => {
  it('declares the type of a template and the function checking a @render, taking the values of the parameters as declared', () => {
    expect(getTemplateHelpers().map(({ text }) => text)).toEqual([
      `type ${TEMPLATE}<Params extends unknown[]> = { readonly __params: Params };`,
      'type __Arguments<Params extends unknown[], Count extends number> = Params[\'length\'] extends Count ? Params : Params extends [...infer Head, unknown] ? __Arguments<Head, Count> : Params;',
      `declare function ${RENDER}<Params extends unknown[], Count extends number>(template: ${TEMPLATE}<Params>, count: Count): (...args: Count extends Params['length'] ? __Arguments<Required<Params>, Count> : Params) => void;`
    ]);
  });
});

describe('getParametersType', () => {
  it('tells the types of the parameters of a template apart by its position', () => {
    expect(getParametersType({ span: { start: 42, end: 80 } })).toBe('__Params42');
  });
});

describe('getContentFunction', () => {
  it('tells the functions the content of the templates is checked in apart by their position', () => {
    expect(getContentFunction({ span: { start: 42, end: 80 } })).toBe('__template42');
  });
});

describe('getLetValue', () => {
  it('tells the constants the values of the @let are checked in apart by their position', () => {
    expect(getLetValue({ span: { start: 42, end: 80 } })).toBe('__let42');
  });
});
