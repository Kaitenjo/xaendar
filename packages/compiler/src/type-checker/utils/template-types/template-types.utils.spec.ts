import { describe, expect, it } from 'vitest';
import { DEFAULT, getContentFunction, getLetValue, getParametersType, getTemplateHelpers, LET, OPTIONAL, PARAMETER, RENDER, TEMPLATE } from './template-types.utils';

describe('getTemplateHelpers', () => {
  it('declares the type of a template, the type of its parameters in its content and the functions checking a @render, the parameters and the @let reading a signal', () => {
    expect(getTemplateHelpers().map(({ text }) => text)).toEqual([
      `type ${TEMPLATE}<Params extends unknown[]> = { readonly __params: Params };`,
      `type ${PARAMETER}<Value> = import('@xaendar/core/signals').Computed<Value>;`,
      `type __Values<Params extends unknown[]> = { [Key in keyof Params]: Exclude<Params[Key], undefined> extends ${PARAMETER}<infer Value> ? Value : never };`,
      'type __Arguments<Params extends unknown[], Count extends number> = Params[\'length\'] extends Count ? Params : Params extends [...infer Head, unknown] ? __Arguments<Head, Count> : Params;',
      `declare function ${RENDER}<Params extends unknown[], Count extends number>(template: ${TEMPLATE}<Params>, count: Count): (...args: Count extends Params['length'] ? __Arguments<__Values<Required<Params>>, Count> : __Values<Params>) => void;`,
      `declare function ${DEFAULT}<Value>(value: Value): ${PARAMETER}<Value>;`,
      `declare function ${OPTIONAL}<Value>(): ${PARAMETER}<Value | undefined>;`,
      `declare function ${LET}<Value>(value: Value): import('@xaendar/core/signals').Computed<Value>;`
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
