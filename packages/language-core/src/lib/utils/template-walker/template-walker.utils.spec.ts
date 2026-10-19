import { type ComponentOrDirectiveMetadata, parseTemplate } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { walkTemplate } from './template-walker.utils';

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
  '@for (item of items; track item.id; i = $index) { {item} @for (q; track $index()) { {r} } }',
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
      'expression $index() [item,i,$first,$last,$even,$odd,$index]',
      'expression r [item,i,$first,$last,$even,$odd,$index]',
      'expression s []',
      'expression t []',
      'expression u []'
    ]);
  });

  it('visits the classes toggled on the elements and in their conditional bindings, with their expressions', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('<p [class.on]="{a}" @if (b) { [class.big]="{c}" } @@tip(text="t")></p>'), [], {
      classBinding: node => visits.push(`class ${node.className}`),
      expression: expression => visits.push(`expression ${expression.getText()}`)
    });

    expect(visits).toEqual(['class on', 'expression a', 'expression b', 'class big', 'expression c']);
  });

  it('visits nothing without callbacks', () => {
    expect(() => walkTemplate(parseTemplate(template), [], {})).not.toThrow();
  });

  it('visits the element refs, visible in the whole of their scope, a block or the content of an element a structural directive is applied to opening one', () => {
    const refsTemplate = [
      '<button (click)="pick(field)">{ field }</button><label><input #field /></label>',
      '@if (a) { { inBranch } <i #inBranch></i> }',
      '@for (item of items; track item()) { { inRow } <i #inRow></i> }',
      '@switch (b) { @case (1) { { inCase } <i #inCase></i> } }',
      '<div *visible>{ inContent } <i #inContent></i></div>',
      '{ c }'
    ].join('\n');
    const visits = new Array<string>();
    walkTemplate(parseTemplate(refsTemplate), [], {
      ref: node => visits.push(`ref ${node.name}`),
      event: (node, _owner, variables) => visits.push(`event ${node.name} [${[...variables].join(',')}]`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'event click [field]',
      'expression field [field,$event]',
      'expression field [field]',
      'ref field',
      'expression a [field]',
      'expression inBranch [field,inBranch]',
      'ref inBranch',
      'expression items [field]',
      'expression item() [field,item,$index,$first,$last,$even,$odd]',
      'expression inRow [field,item,$index,$first,$last,$even,$odd,inRow]',
      'ref inRow',
      'expression b [field]',
      'expression inCase [field,inCase]',
      'ref inCase',
      'expression inContent [field,inContent]',
      'ref inContent',
      'expression c [field]'
    ]);
  });

  it('visits the templates, visible in the whole of their scope, the default values and the content as a scope declaring their parameters, and the @render with their arguments', () => {
    const templatesTemplate = [
      '@render row(field)',
      '<label><input #field /></label>',
      '<template #row(item: Item, label = item().name)>{ item() } <i #inRow></i> @render row(inRow)</template>'
    ].join('\n');
    const visits = new Array<string>();
    walkTemplate(parseTemplate(templatesTemplate), [], {
      ref: node => visits.push(`ref ${node.name}`),
      template: node => visits.push(`template ${node.ref.name}`),
      render: node => visits.push(`render ${node.callee}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'render row',
      'expression field [field,row]',
      'ref field',
      'template row',
      'expression item().name [field,row,item,label]',
      'expression item() [field,row,item,label,inRow]',
      'ref inRow',
      'render row',
      'expression inRow [field,row,item,label,inRow]'
    ]);
  });

  it('visits the @let, visible in the whole of their scope, and their value', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('<p>{ total }</p><div>@let total = a + 1;</div>@if (b) { @let inBranch = total; }'), [], {
      let: node => visits.push(`let ${node.name}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'expression total [total]',
      'let total',
      'expression a + 1 [total]',
      'expression b [total]',
      'let inBranch',
      'expression total [total,inBranch]'
    ]);
  });
});
