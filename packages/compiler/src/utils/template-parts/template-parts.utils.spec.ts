import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../compile/compile';
import { collectTemplateParts, parseExportParts } from './template-parts.utils';

describe('collectTemplateParts', () => {
  it('reads the static parts, the parts toggled one by one and the ones exportparts forwards, each once, in order', () => {
    const ast = parseTemplate('<header part="header  title"></header><button part.selected="{on}" @if (x) { part.first="{1}" part="tab header" }></button><x-icon exportparts="glyph: icon, size"></x-icon>');

    expect(collectTemplateParts(ast)).toEqual({ names: ['header', 'title', 'selected', 'tab', 'first', 'icon', 'size'] });
  });

  it('reads the parts of the nested blocks and of the templates it declares and renders', () => {
    expect(collectTemplateParts(parseTemplate('@if (a) { @for (i of items; track i) { <li part="item"></li> } }<template row()><b part="cell"></b></template>@render row()'))).toEqual({ names: ['item', 'cell'] });
  });

  it.each([
    ['a part computed by an expression', '<p part="{kind}"></p><i part="known"></i>'],
    ['an exportparts computed by an expression', '<x-a exportparts="{names}"></x-a><i part="known"></i>'],
    ['a part computed in a branch', '<i part.known="{1}" @if (x) { part="{kind}" }></i>'],
    ['a @render of a template given to the component', '<i part="known"></i>@render row()']
  ])('keeps the known parts and opens the parts for %s', (_name, template) => {
    expect(collectTemplateParts(parseTemplate(template))).toEqual({ names: ['known'], open: true });
  });

  it('reads no part of a template without any, nor of a part named only by whitespace', () => {
    expect(collectTemplateParts(parseTemplate('<p class="a" part=" "></p>'))).toEqual({ names: [] });
  });
});

describe('parseExportParts', () => {
  it('reads the names, renamed or not, with the span of the name of the inner part', () => {
    const text = ' label , icon :  button-icon,size';
    const entries = parseExportParts(text, 10);

    expect(entries.map(({ inner, outer }) => [inner, outer])).toEqual([['label', 'label'], ['icon', 'button-icon'], ['size', 'size']]);
    expect(entries.map(({ innerSpan }) => text.slice(innerSpan.start - 10, innerSpan.end - 10))).toEqual(['label', 'icon', 'size']);
  });

  it('leaves out the entries naming no part, or more than one name on a side', () => {
    expect(parseExportParts(',, a b, :c, d:, e:f:g, h', 0).map(({ inner }) => inner)).toEqual(['h']);
    expect(parseExportParts('', 0)).toEqual([]);
  });
});
