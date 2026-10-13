import { type ComponentOrDirectiveMetadata, type ForNode, parseTemplate } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { getForVariables, walkTemplate } from './template-walker.utils';

const component = { type: 'component', selector: 'my-child', className: 'Child' } as ComponentOrDirectiveMetadata;
const directive = { type: 'directive', selector: 'tooltip', className: 'Tooltip' } as ComponentOrDirectiveMetadata;

const template = [
  '@import { Child } from \'./child\';',
  'text',
  '<my-child label="{a}" (picked)="f($event, b)" @if (c) { x="1" } @else { y="2" } @switch (d) { @case (1) { z="{e}" } }>',
  '  <span @@tooltip(text="t" (shown)="g()" @if (h) { title="u" }) *media(query="q") @if (i) { @@other }></span>',
  '</my-child>',
  '@if (j) { {k} } @else if (l) { {m} } @else { {n} }',
  '@if (o) { {p} }',
  '@for (item of items; track item.id; i = $index) { {item} @for (q; track $index) { {r} } }',
  '@switch (s) { @case (1) { {t} } @default { {u} } }'
].join('\n');

describe('walkTemplate', () => {
  it('visits every part of the template, with the owner of the bindings and the variables in scope', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate(template), [component, directive], {
      importNode: node => visits.push(`import ${node.path}`),
      element: (node, owner) => visits.push(`element ${node.tagName} ${owner?.className}`),
      attribute: (node, owner) => visits.push(`attribute ${node.name} ${owner?.className}`),
      event: (node, owner) => visits.push(`event ${node.name} ${owner?.className}`),
      directive: (node, owner) => visits.push(`directive ${node.selector} ${owner?.className}`),
      forBlock: node => visits.push(`for ${node.itemAlias}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'import ./child',
      'element my-child Child',
      'attribute label Child',
      'expression a []',
      'event picked Child',
      'expression $event [$event]',
      'expression b [$event]',
      'expression c []',
      'attribute x Child',
      'attribute y Child',
      'expression d []',
      'attribute z Child',
      'expression e []',
      'element span undefined',
      'expression i []',
      'directive other undefined',
      'directive tooltip Tooltip',
      'attribute text Tooltip',
      'event shown Tooltip',
      'expression h []',
      'attribute title Tooltip',
      'directive media undefined',
      'attribute query undefined',
      'expression j []',
      'expression k []',
      'expression l []',
      'expression m []',
      'expression n []',
      'expression o []',
      'expression p []',
      'for item',
      'expression items []',
      'expression item.id [item,i,$first,$last,$even,$odd]',
      'expression item [item,i,$first,$last,$even,$odd]',
      'for undefined',
      'expression q [item,i,$first,$last,$even,$odd]',
      'expression $index [item,i,$first,$last,$even,$odd,$index]',
      'expression r [item,i,$first,$last,$even,$odd,$index]',
      'expression s []',
      'expression t []',
      'expression u []'
    ]);
  });

  it('visits nothing without callbacks', () => {
    expect(() => walkTemplate(parseTemplate(template), [], {})).not.toThrow();
  });
});

describe('getForVariables', () => {
  it('returns the item alias and the implicit variables, by their alias if any', () => {
    const [withAlias] = parseTemplate('@for (item of items; track item; f = $first) {}') as ForNode[];
    const [withoutAlias] = parseTemplate('@for (3) {}') as ForNode[];

    expect(getForVariables(withAlias)).toEqual(['item', '$index', 'f', '$last', '$even', '$odd']);
    expect(getForVariables(withoutAlias)).toEqual(['$index', '$first', '$last', '$even', '$odd']);
  });
});
