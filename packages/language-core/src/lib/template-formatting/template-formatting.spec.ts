import { describe, expect, it } from 'vitest';
import { getTemplateFormatting } from './template-formatting';

const options = { indent: '  ', indentWidth: 2, printWidth: 120 };

describe('getTemplateFormatting', () => {
  it('replaces the whole template with the formatted one', () => {
    const source = '<div><p>{name}</p></div>';

    expect(getTemplateFormatting(source, options)).toEqual({ span: { start: 0, end: source.length }, newText: '<div>\n  <p>{ name }</p>\n</div>\n' });
  });

  it('changes nothing for a template that is already formatted, or whose layout cannot be read', () => {
    expect(getTemplateFormatting('<p></p>\n', options)).toBeUndefined();
    expect(getTemplateFormatting('<p>', options)).toBeUndefined();
  });
});
