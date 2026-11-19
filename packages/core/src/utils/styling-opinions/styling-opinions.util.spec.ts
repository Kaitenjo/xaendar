// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import { hostKeys, hostString, keyOpinion, runValue, stringOpinions, templateKeys, templateString } from './styling-opinions.util';

describe('stringOpinions', () => {
  it('gives the classes of a class string, present, each once', () => {
    expect(stringOpinions('class', ' a b\ta ')).toEqual(['a', true, 'b', true]);
    expect(stringOpinions('class', 'one')).toEqual(['one', true]);
    expect(stringOpinions('class', 12)).toEqual(['12', true]);
    expect(stringOpinions('class', '  ')).toBeNull();
  });

  it('gives the declarations of a style string', () => {
    expect(stringOpinions('style', 'display: flex; gap: 4px !important')).toEqual(['display', 'flex', 'gap', '4px !important']);
    expect(stringOpinions('style', ';')).toBeNull();
  });

  it('has no opinion for null and undefined', () => {
    expect(stringOpinions('class', null)).toBeNull();
    expect(stringOpinions('style', undefined)).toBeNull();
  });
});

describe('keyOpinion', () => {
  it('makes a class present for a truthy value and absent for a falsy one', () => {
    expect(keyOpinion('class', 1, '')).toBe(true);
    expect(keyOpinion('class', 'yes', '')).toBe(true);
    expect([false, 0, '', NaN].map(value => keyOpinion('class', value, ''))).toEqual([false, false, false, false]);
  });

  it('gives a property its value followed by its unit, no opinion for an empty string', () => {
    expect(keyOpinion('style', 10, 'px')).toBe('10px');
    expect(keyOpinion('style', 'red', '')).toBe('red');
    expect(keyOpinion('style', 0, '')).toBe('0');
    expect(keyOpinion('style', '', 'px')).toBeUndefined();
  });

  it('has no opinion for null and undefined', () => {
    expect(keyOpinion('class', null, '')).toBeUndefined();
    expect(keyOpinion('style', undefined, 'px')).toBeUndefined();
  });
});

describe('templateString and templateKeys', () => {
  const styling = (members: Partial<_RenderStyling>): _RenderStyling => ({ name: 'class', setter: () => undefined, ...members });

  it('give the static string as the compiler parsed it, shared by every element', () => {
    const statics = ['a', true];
    expect(templateString(styling({ statics }), undefined)).toBe(statics);
    expect(templateKeys(styling({ statics }), undefined)).toBeNull();
  });

  it('read the value of the only expression as it is, and the values of more of them in order, the string first', () => {
    expect(templateString(styling({ string: () => 'a b' }), 'a b')).toEqual(['a', true, 'b', true]);
    expect(templateKeys(styling({ keys: ['on'], values: [() => 1] }), 1)).toEqual(['on', true]);
    const both = styling({ name: 'style', string: () => '', keys: ['width', 'top'], values: [() => 1, () => null], units: ['px', ''] });
    expect(templateString(both, ['color: red', 2, null])).toEqual(['color', 'red']);
    expect(templateKeys(both, ['color: red', 2, null])).toEqual(['width', '2px']);
    expect(templateString(styling({}), 'a')).toBeNull();
  });

  it('have no opinion before the first run', () => {
    const both = styling({ string: () => '', keys: ['on'], values: [() => 1] });
    expect(templateString(both, undefined)).toBeNull();
    expect(templateKeys(both, null)).toBeNull();
  });
});

describe('hostString and hostKeys', () => {
  it('read the values of a run, a single one kept as it is', () => {
    const read = () => undefined;
    const single = new HostStylingRun({} as never, document.createElement('div'), 'class', [{ name: 'on', kind: 'class', read }], 0x10000);
    expect(hostKeys(single, 1)).toEqual(['on', true]);
    expect(hostString(single, 1)).toBeNull();

    const many = new HostStylingRun({} as never, document.createElement('div'), 'style', [{ name: '', kind: 'style', read }, { name: 'width', kind: 'style', unit: 'px', read }, { name: 'top', kind: 'style', read }], 0x20000);
    expect(hostString(many, ['gap: 1px', 3, null])).toEqual(['gap', '1px']);
    expect(hostKeys(many, ['gap: 1px', 3, null])).toEqual(['width', '3px']);
    expect(hostKeys(many, undefined)).toBeNull();
  });

  it('runValue reads a single value as it is', () => {
    expect(runValue('a', 1, 0)).toBe('a');
    expect(runValue(['a', 'b'], 2, 1)).toBe('b');
    expect(runValue(undefined, 2, 1)).toBeUndefined();
  });
});
