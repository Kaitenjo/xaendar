import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../compile/compile';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
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

  it('visits the classes toggled on the elements and in their conditional bindings, with their expressions', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('<p [class.on]="{a}" @if (b) { [class.big]="{c}" } @@tip(text="t")></p>'), [], {
      classBinding: node => visits.push(`class ${node.className}`),
      expression: expression => visits.push(`expression ${expression.getText()}`)
    });

    expect(visits).toEqual(['class on', 'expression a', 'expression b', 'class big', 'expression c']);
  });

  it('visits the expression of when of a @hydrate, then its content, a scope of its own', () => {
    const hydrateTemplate = [
      '<input #field />',
      '@hydrate (idle, when field.checked) { { inContent } <i #inContent></i> }',
      '<p>{ a }</p>'
    ].join('\n');
    const visits = new Array<string>();
    walkTemplate(parseTemplate(hydrateTemplate), [], {
      ref: node => visits.push(`ref ${node.name}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'ref field',
      'expression field.checked [field]',
      'expression inContent [field,inContent]',
      'ref inContent',
      'expression a [field]'
    ]);
  });

  it('visits a @client and its @placeholder, scopes of their own, and a @hydrate', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('@client { { a } <i #inContent></i> } @placeholder { { b } <i #inPlaceholder></i> } @hydrate (idle) { }'), [], {
      client: node => visits.push(`client ${node.children.length}`),
      hydrate: node => visits.push(`hydrate ${node.triggers.length}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'client 3',
      'expression a [inContent]',
      'expression b [inPlaceholder]',
      'hydrate 1'
    ]);
  });

  it('visits a @try and its @catch, scopes of their own, the @catch declaring the error under its name', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('@try { { a } <i #inContent></i> } @catch (failure) { { failure } } @try { } @catch { { b } }'), [], {
      tryBlock: node => visits.push(`try ${node.catch.name}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    }, true);

    expect(visits).toEqual([
      'try failure',
      'expression a [inContent]',
      'expression failure [failure]',
      'try undefined',
      'expression b []'
    ]);
  });

  it('visits a @defer, the expression of when, its content and the blocks following it, scopes of their own, the @error declaring the error under its name', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('@defer (when a) { { b } <i #inContent></i> } @placeholder { { c } } @loading { { d } } @error (failure) { { failure } } @defer (idle) { } @error { { e } }'), [], {
      defer: node => visits.push(`defer ${node.triggers.length}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'defer 1',
      'expression a []',
      'expression b [inContent]',
      'expression c []',
      'expression d []',
      'expression failure [failure]',
      'defer 1',
      'expression e []'
    ]);
  });

  it('visits the element refs and the options of the triggers, the ones following prefetch too', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('<b #more></b>@defer (hover(more), interaction, visible({ rootMargin: margin }), timer(1s), prefetch visible(more), prefetch when soon) { }'), [], {
      expression: expression => visits.push(expression.getText())
    });

    expect(visits).toEqual(['more', '{ rootMargin: margin }', 'more', 'soon']);
  });

  it('walks only the @placeholder of a @defer when asked to walk what the server renders', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('@defer (when a) { {b} } @placeholder { {c} } @loading { {d} } @error { {e} } @defer (idle) { {f} }'), [], {
      expression: expression => visits.push(expression.getText())
    }, true);

    expect(visits).toEqual(['c']);
  });

  it('walks a @client without a @placeholder, and nothing without callbacks', () => {
    expect(() => walkTemplate(parseTemplate('@client { }'), [], {})).not.toThrow();
  });

  it('walks only what the server renders when asked to', () => {
    const serverTemplate = [
      '<a b="{c}" (x)="d($event)" @@tip(e="{f}") *media(g="{h}")>{i}</a>',
      '@hydrate (idle, when j) { {k} }',
      '@client { {l} } @placeholder { {m} }',
      '@client { {n} }'
    ].join('\n');
    const visits = new Array<string>();
    walkTemplate(parseTemplate(serverTemplate), [], {
      event: node => visits.push(`event ${node.name}`),
      directive: node => visits.push(`directive ${node.selector}`),
      expression: expression => visits.push(expression.getText())
    }, true);

    expect(visits).toEqual(['c', 'directive media', 'h', 'i', 'k', 'm']);
  });

  it('visits nothing without callbacks', () => {
    expect(() => walkTemplate(parseTemplate(template), [], {})).not.toThrow();
  });

  it('visits the element refs, visible in the whole of their scope, a block or the content of an element a structural directive is applied to opening one', () => {
    const refsTemplate = [
      '<button (click)="pick(field)">{ field }</button><label><input #field /></label>',
      '@if (a) { { inBranch } <i #inBranch></i> }',
      '@for (item of items; track item) { { inRow } <i #inRow></i> }',
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
      'expression item [field,item,$index,$first,$last,$even,$odd]',
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
      '<template row(item: Item, label = item.name)>{ item } <i #inRow></i> @render row(inRow)</template>'
    ].join('\n');
    const visits = new Array<string>();
    walkTemplate(parseTemplate(templatesTemplate), [], {
      ref: node => visits.push(`ref ${node.name}`),
      template: node => visits.push(`template ${node.declaration.name}`),
      render: node => visits.push(`render ${node.callee}`),
      expression: (expression, variables) => visits.push(`expression ${expression.getText()} [${[...variables].join(',')}]`)
    });

    expect(visits).toEqual([
      'render row',
      'expression field [field,row]',
      'ref field',
      'template row',
      'expression item.name [field,row,item,label]',
      'expression item [field,row,item,label,inRow]',
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

  it('visits the @case and the @default of a @switch before their content', () => {
    const visits = new Array<string>();
    walkTemplate(parseTemplate('@switch (mode) { @case (1, limit) { {a} } @default { {b} } }'), [], {
      switchCase: node => visits.push(`case ${node.condition?.join(',') ?? 'default'}`),
      expression: expression => visits.push(`expression ${expression.getText()}`)
    });

    expect(visits).toEqual(['expression mode', 'case 1, limit', 'expression a', 'case default', 'expression b']);
  });
});
