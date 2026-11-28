import { type ComponentOrDirectiveMetadata, parseTemplate } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { getExportPartsWarnings } from './template-part-warnings';

/**
 * A component of the project whose template is the one given.
 */
const component = (selector: string, template: string, extended?: string) => ({ type: 'component', className: 'C', selector, extends: extended, modulePath: `/src/${selector}.ts`, templateUrl: `./${selector}.html`, properties: new Map(), events: new Map(), template }) as unknown as ComponentOrDirectiveMetadata & { template: string };

/**
 * The warnings of a template rendering the components given, as the text they are reported on and their message.
 */
function warn(source: string, ...metadatas: Array<ComponentOrDirectiveMetadata & { template: string }>): Array<[string, string]> {
  const read = (fileName: string) => metadatas.find(({ selector }) => fileName.replaceAll('\\', '/').endsWith(`/src/${selector}.html`))?.template;
  return getExportPartsWarnings(parseTemplate(source), metadatas, read).map(({ span, message }) => [source.slice(span.start, span.end), message]);
}

describe('getExportPartsWarnings', () => {
  const tabs = component('x-tabs', '<button part="tab" part.selected="{on}"></button>');

  it('warns on each name of exportparts the component does not expose, renamed or not, the branches included', () => {
    expect(warn('<x-tabs exportparts="tab, tabs: list, selected: current"></x-tabs><x-tabs @if (a) { exportparts="label" }></x-tabs>', tabs)).toEqual([
      ['tabs', '\'tabs\' is not a part of <x-tabs>, which exposes tab, selected: exportparts forwards only the parts the component exposes.'],
      ['label', '\'label\' is not a part of <x-tabs>, which exposes tab, selected: exportparts forwards only the parts the component exposes.']
    ]);
  });

  it('names a customized built-in element by its tag and its is, and a component exposing no part', () => {
    expect(warn('<button is="x-copy" exportparts="icon"></button>', component('x-copy', '<i></i>', 'button'))).toEqual([
      ['icon', '\'icon\' is not a part of <button is="x-copy">, which exposes no part: exportparts forwards only the parts the component exposes.']
    ]);
  });

  it('says nothing of a component whose parts are open or unknown, of an exportparts computed by an expression, nor of a native element', () => {
    expect(warn('<x-open exportparts="any"></x-open>', component('x-open', '<p part="{kind}"></p>'))).toEqual([]);
    expect(warn('<x-broken exportparts="any"></x-broken>', component('x-broken', '<p part.="{a}"></p>'))).toEqual([]);
    expect(warn('<x-tabs exportparts="{names}"></x-tabs><div exportparts="any"></div>', tabs)).toEqual([]);
  });
});
