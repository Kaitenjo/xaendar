import { describe, expect, it } from 'vitest';
import { GeneratorContext } from '../../generator/context/context';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import type { ElementNode } from '../../parser/types/nodes/element-node.type';
import type { ContextCache } from '../../types/context-cache.type';
import { mapContentTemplates } from './content-templates.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ElementNode;

/**
 * Creates the context of a scope declaring the templates named, read as the constants describing them.
 */
function declaring(...names: string[]): GeneratorContext {
  const context = new GeneratorContext({} as ContextCache);
  for (let i = 0; i < names.length; i++) {
    context.addIdentifier(names[i], 'template', `template_${names[i]}$template`);
  }

  return context;
}

describe('mapContentTemplates', () => {
  it('describes the templates written among the children of the element, in order, by their name and their template', () => {
    const element = parse('<my-list><template row(item: string)></template><li></li><template header()></template></my-list>');
    expect(mapContentTemplates(element, declaring('row', 'header'))).toEqual([
      '{ name: \'row\', template: template_row$template }',
      '{ name: \'header\', template: template_header$template }'
    ]);
  });

  it('describes nothing for an element without templates among its children', () => {
    expect(mapContentTemplates(parse('<my-list><li></li></my-list>'), declaring())).toEqual([]);
  });

  it('throws for a template passed to an element a structural directive is applied to, pointing to its name', () => {
    const template = '<my-list *when><template row()></template></my-list>';
    expect(() => mapContentTemplates(parse(template), declaring('row'))).toThrow('<my-list> cannot receive the template "row" as content: a structural directive is applied to it, whose content is a scope of its own. Apply the directive to an element wrapping it');
    expect(() => mapContentTemplates(parse(template), declaring('row'))).toThrow(expect.objectContaining({ cause: { start: template.indexOf('row'), end: template.indexOf('row') + 3 } }));
  });
});
