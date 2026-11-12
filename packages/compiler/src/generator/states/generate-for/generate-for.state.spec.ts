import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { GeneratorContext } from '../../context/context';
import { generateFor } from './generate-for.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ForNode;

/**
 * Builds a scope declaring the given identifiers.
 */
const contextWith = (...identifiers: string[]) => {
  const context = new GeneratorContext(cache);
  for (let i = 0; i < identifiers.length; i++) {
    context.addIdentifier(identifiers[i]);
  }

  return context;
};

/**
 * Returns the declaration of a constant of the module, found by its name.
 */
const constantOf = (context: GeneratorContext, name: string) => context.constantDeclarations.find(declaration => declaration.startsWith(`const ${name} = `));

/**
 * Returns the declaration of a function of the module, found by its name.
 */
const functionOf = (context: GeneratorContext, name: string) => context.functionDeclarations.find(declaration => declaration.startsWith(`function ${name}(`));

describe('generateFor', () => {
  it('generates the _for call and registers the loop body function', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { <li>{ item } { $index } { $first } { $last } { $even } { $odd }</li> }'), 'root', '0', context, null);

    expect(code).toEqual(['_for(root, context, null, for0$for);']);
    expect(context.constantDeclarations).toEqual([
      'const for0Variables = { used: [\'item\', \'$index\', \'$first\', \'$last\', \'$even\', \'$odd\'], ids: [0, 1, 2, 3, 4, 5] };',
      'const for0$for = { items: for0$items, track: for0$track, block: for0, variables: for0Variables };'
    ]);
    expect(context.functionDeclarations).toEqual([
      'function for0$items(context) {\n  return this.items;\n}',
      'function for0$track(context, item, $index, $first, $last, $even, $odd) {\n  return item.id;\n}'
    ]);

    const body = functionsToProcess?.get('for0');
    expect(body?.args).toEqual(['for0', 'parentContext', 'items0', 'i0', 'anchor', 'nodeStrategy']);
    expect(body?.fn).toMatchObject({ parentNode: 'for0', anchor: 'anchor' });
    expect(body?.fn.precode).toBe('_iterationVariables(context, items0, i0, for0Variables);');
  });

  it('declares the last node of its parent last, its body keeping the anchor of the items, which move', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { <li></li> }'), 'ul0', '0', context, null, false, true);

    expect(code).toEqual(['_for(ul0, context, null, ul0__for0$for);']);
    expect(constantOf(context, 'ul0__for0$for')).toBe('const ul0__for0$for = { items: ul0__for0$items, track: ul0__for0$track, block: ul0__for0, last: true };');
    expect(functionsToProcess!.get('ul0__for0')!.fn.anchor).toBe('anchor');
  });

  it('names the constants and the functions after the function of the body, unique in the module', async () => {
    const context = new GeneratorContext(cache);
    context.declareConstant('tr0__for1Variables', '{}');
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { { item } }'), 'tr0', '1', context, 'anchor');
    const { fn } = functionsToProcess!.get('tr0__for1')!;

    expect(code).toEqual(['_for(tr0, context, anchor, tr0__for1$for);']);
    expect(constantOf(context, 'tr0__for1Variables1')).toBe('const tr0__for1Variables1 = { used: [\'item\'], ids: [0] };');
    expect(constantOf(context, 'tr0__for1$for')).toBe('const tr0__for1$for = { items: tr0__for1$items, track: tr0__for1$track, block: tr0__for1, variables: tr0__for1Variables1 };');
    expect(fn.precode).toBe('_iterationVariables(context, tr0__items1, tr0__i1, tr0__for1Variables1);');
  });

  it('declares the item and the implicit variables the body reads as variables of the body', async () => {
    const { functionsToProcess } = await generateFor(parse('@for (item of items; track item.id; i = $index) { <li>{ item } { i }</li> }'), 'root', '0', new GeneratorContext(cache), null);
    const context = functionsToProcess!.get('for0')!.fn.context;

    expect(context.getIdentifierKind('item')).toBe('variable');
    expect(context.getIdentifierKind('i')).toBe('variable');
  });

  it('lists the variables of the enclosing scopes the iterable and the track expression read in the configuration, after the variables of the body', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    context.addIdentifier('prefix', 'variable');
    await generateFor(parse('@for (cell of row.cells; track prefix + cell) { { cell } }'), 'root', '0', context, null);
    await generateFor(parse('@for (cell of row.cells; track cell) { x }'), 'root', '1', context, null);

    expect(constantOf(context, 'for0$for')).toBe('const for0$for = { items: for0$items, track: for0$track, block: for0, variables: for0Variables, reads: _reads0 };');
    expect(constantOf(context, 'for1$for')).toBe('const for1$for = { items: for1$items, track: for1$track, block: for1, reads: _reads1, container: 1 };');
    expect(functionOf(context, 'for0$track')).toBe('function for0$track(context, cell, $index, $first, $last, $even, $odd) {\n  return _read(context, 0, 8) + cell;\n}');
    expect(context.readsDeclarations).toEqual(['const _reads0 = [0, 1];', 'const _reads1 = [0];']);
  });

  it('reads the iterable from the context when it is declared in scope', async () => {
    const context = contextWith('items');
    await generateFor(parse('@for (item of items; track item) { <li></li> }'), 'root', '0', context, 'anchor');

    expect(functionOf(context, 'for0$items')).toBe('function for0$items(context) {\n  return _read(context, 0, 7);\n}');
  });

  it('resolves every identifier of the iterable expression', async () => {
    const context = contextWith('item');
    await generateFor(parse('@for (child of item.children(); track child) { <li></li> }'), 'root', '0', context, null);

    expect(functionOf(context, 'for0$items')).toBe('function for0$items(context) {\n  return _read(context, 0, 7).children();\n}');
  });

  it('reads the item and the implicit variables as the parameters of the track function, resolving the members, the imports and the variables of the enclosing scopes', async () => {
    const context = contextWith('prefix');
    context.addImportedIdentifier('keyOf', '__keyOf');
    await generateFor(parse('@for (item of items; track keyOf(item) + prefix + separator + $index) { <li></li> }'), 'root', '0', context, null);

    expect(functionOf(context, 'for0$track')).toBe('function for0$track(context, item, $index, $first, $last, $even, $odd) {\n  return __keyOf(item) + _read(context, 0, 7) + this.separator + $index;\n}');
  });

  it('names the context of the track function __context when the item or an alias is named context, which would repeat a parameter', async () => {
    const context = new GeneratorContext(cache);
    await generateFor(parse('@for (context of items; track context.id) { x }'), 'root', '0', context, null);
    await generateFor(parse('@for (item of items; track context; context = $index) { x }'), 'root', '1', context, null);
    const track = functionOf(context, 'for0$track')!;

    expect(track).toBe('function for0$track(__context, context, $index, $first, $last, $even, $odd) {\n  return context.id;\n}');
    expect(functionOf(context, 'for1$track')).toBe('function for1$track(__context, item, context, $first, $last, $even, $odd) {\n  return context;\n}');
    expect(new Function(`'use strict';\n${track}\nreturn for0$track;`)()(null, { id: 7 })).toBe(7);
  });

  it.each([
    ['10', '10'],
    ['numbers', 'this.numbers'],
    ['numbers()', 'this.numbers()']
  ])('generates a loop without item alias over %s', async (iterable, expected) => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateFor(parse(`@for (${iterable}; track $index) { <li></li> }`), 'root', '0', context, null);

    expect(code).toEqual(['_for(root, context, null, for0$for);']);
    expect(context.constantDeclarations).toEqual(['const for0$for = { items: for0$items, track: for0$track, block: for0 };']);
    expect(context.functionDeclarations).toEqual([
      `function for0$items(context) {\n  return ${expected};\n}`,
      'function for0$track(context, _, $index, $first, $last, $even, $odd) {\n  return $index;\n}'
    ]);
    expect(functionsToProcess?.get('for0')?.fn.precode).toBeUndefined();
  });

  it('applies the aliases declared for implicit variables, reading a variable by the name the template writes', async () => {
    const generatorContext = new GeneratorContext(cache);
    const { functionsToProcess } = await generateFor(parse('@for (item of items; track item; i = $index) { <li>{ i }</li> }'), 'root', '0', generatorContext, null);
    const { context } = functionsToProcess!.get('for0')!.fn;

    expect(functionOf(generatorContext, 'for0$track')).toBe('function for0$track(context, item, i, $first, $last, $even, $odd) {\n  return item;\n}');
    expect(constantOf(generatorContext, 'for0Variables')).toBe('const for0Variables = { used: [\'$index\'], ids: [0] };');
    expect(context.getIdentifierKind('i')).toBe('variable');
    expect(context.getIdentifierKind('$index')).toBeUndefined();
  });

  describe('creates only the variables the body reads', () => {
    /**
     * Generates a @for and returns the variables the function of its body creates, its precode and its context.
     */
    const generateBody = async (template: string) => {
      const generatorContext = new GeneratorContext(cache);
      const { fn } = (await generateFor(parse(template), 'root', '0', generatorContext, null)).functionsToProcess!.get('for0')!;
      const declaration = constantOf(generatorContext, 'for0Variables') ?? '';
      return { created: /used: \[(.*?)\]/.exec(declaration)?.[1] ?? '', names: fn.context.variableNames.map(name => `'${name}'`).join(', '), precode: fn.precode!, context: fn.context };
    };

    it('creates none when the body reads none, the track expression reading them as its parameters', async () => {
      const { created, precode, context } = await generateBody('@for (item of items(); track item.id + $index) { <li>static</li> }');

      expect(created).toBe('');
      expect(precode).toBeUndefined();
      expect(context.getIdentifierKind('item')).toBeUndefined();
      expect(context.getIdentifierKind('$index')).toBeUndefined();
    });

    it('creates only the item when the body reads only the item', async () => {
      const { created, names } = await generateBody('@for (item of items(); track item.id) { <li>{ item.name }</li> }');

      expect(created).toBe('\'item\'');
      expect(names).toBe('\'item\'');
    });

    it('creates $index read only by an event', async () => {
      const { created } = await generateBody('@for (item of items(); track item.id) { <button (click)="select($index)">x</button> }');
      expect(created).toBe('\'$index\'');
    });

    it('creates the item read only by the handler of an event, as the object the method is called on', async () => {
      const { created } = await generateBody('@for (item of items(); track item.id) { <button (click)="item.set(null)">x</button> }');
      expect(created).toBe('\'item\'');
    });

    it('creates $last read only inside a nested @if', async () => {
      const { created } = await generateBody('@for (item of items(); track item.id) { <li>@if (show()) { @if (!$last) { <hr /> } }</li> }');
      expect(created).toBe('\'$last\'');
    });

    it('creates the variables read by their alias', async () => {
      const { created, names } = await generateBody('@for (item of items(); track item.id; i = $index, odd = $odd) { <li [class.odd]="{odd}">{ i }</li> }');

      expect(created).toBe('\'$index\', \'$odd\'');
      expect(names).toBe('\'i\', \'odd\'');
    });

    it('creates a variable read only by a template declared in the body', async () => {
      const { created } = await generateBody('@for (item of items(); track item.id) { <template row(label: string)><p>{ label } { $even }</p></template>@render row(\'x\') }');
      expect(created).toBe('\'$even\'');
    });

    it('creates a variable read only by the condition of a @case', async () => {
      const { created } = await generateBody('@for (item of items(); track item.id) { @switch (mode()) { @case ($first) { a } } }');
      expect(created).toBe('\'$first\'');
    });

    it('creates the variables of the outer @for read by a nested @for', async () => {
      const { created, names } = await generateBody('@for (row of rows(); track row.id) { <tr>@for (cell of row.cells; track cell.id) { <td>{ cell } { $first }</td> }</tr> }');

      expect(created).toBe('\'item\', \'$first\'');
      expect(names).toBe('\'row\', \'$first\'');
    });

    it('creates a variable whose name a nested @for or a @let declares again', async () => {
      const { created } = await generateBody('@for (item of items(); track item.id) { @let $odd = 1; { $odd } @for (cell of cells(); track $index) { { $index } } }');
      expect(created).toBe('\'$index\', \'$odd\'');
    });
  });
});
