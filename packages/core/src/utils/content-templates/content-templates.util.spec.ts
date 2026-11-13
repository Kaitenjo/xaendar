import { describe, expect, it } from 'vitest';
import { HEADER } from '../../costants';
import { _scope } from '../context/context.util';
import { _templateRef } from '../template/template.util';
import { _setContentTemplates, getContentTemplate } from './content-templates.util';

const LAYOUT = { size: HEADER, nodes: HEADER };

describe('content templates', () => {
  it('passes to an element the templates written among its children, each one read as a value in the context rendering it', () => {
    const element = {};
    const context = _scope(null, LAYOUT);
    const row = { render: () => context, parameters: [] };
    const header = { render: () => context, parameters: [] };

    _setContentTemplates(element, context, [{ name: 'row', template: row }, { name: 'header', template: header }]);

    expect(getContentTemplate(element, 'row')).toBe(_templateRef(context, 0, row));
    expect(getContentTemplate(element, 'header')).toBe(_templateRef(context, 0, header));
    expect(getContentTemplate(element, 'footer')).toBeUndefined();
  });

  it('finds no template on an element receiving none', () => {
    expect(getContentTemplate({}, 'row')).toBeUndefined();
  });
});
