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
  identifiers.forEach(identifier => context.addIdentifier(identifier));
  return context;
};

describe('generateFor', () => {
  it('generates the _for call and registers the loop body function', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { <li>{ item() } { $index() } { $first() } { $last() } { $even() } { $odd() }</li> }'), 'root', '0', new GeneratorContext(cache), null);

    expect(code).toEqual(['_for(root, context, null, () => this.items, (item, $index, $first, $last, $even, $odd) => item.id, for0.bind(this), for0Variables);']);

    const body = functionsToProcess?.get('for0');
    expect(body?.args).toEqual(['for0', 'parentContext', 'items0', 'i0', 'anchor', 'nodeStrategy']);
    expect(body?.fn).toMatchObject({ parentNode: 'for0', anchor: 'anchor', isForBody: true });
    expect(body?.fn.declaration).toBe('const for0Variables = { used: [\'item\', \'$index\', \'$first\', \'$last\', \'$even\', \'$odd\'], names: [\'item\', \'$index\', \'$first\', \'$last\', \'$even\', \'$odd\'] };');
    expect(body?.fn.precode).toBe('const entry = _iterationVariables(context, items0, i0, for0Variables);');
  });

  it('names the constant of the variables after the function of the body, unique in the module', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { { item() } }'), 'tr0', '1', new GeneratorContext(cache), 'anchor');
    const { fn } = functionsToProcess!.get('tr0__for1')!;

    expect(code[0]).toMatch(/, tr0__for1\.bind\(this\), tr0__for1Variables\);$/);
    expect(fn.declaration).toBe('const tr0__for1Variables = { used: [\'item\'], names: [\'item\'] };');
    expect(fn.precode).toBe('const entry = _iterationVariables(context, tr0__items1, tr0__i1, tr0__for1Variables);');
  });

  it('declares the item and the implicit variables the body reads as signals of the body', async () => {
    const { functionsToProcess } = await generateFor(parse('@for (item of items; track item.id; i = $index) { <li>{ item() } { i() }</li> }'), 'root', '0', new GeneratorContext(cache), null);
    const context = functionsToProcess!.get('for0')!.fn.context;

    expect(context.getIdentifierKind('item')).toBe('signal');
    expect(context.getIdentifierKind('i')).toBe('signal');
  });

  it('reads the iterable from the context when it is declared in scope', async () => {
    const { code } = await generateFor(parse('@for (item of items; track item()) { <li></li> }'), 'root', '0', contextWith('items'), 'anchor');
    expect(code[0]).toContain('_for(root, context, anchor, () => context.get(\'items\'),');
  });

  it('resolves every identifier of the iterable expression', async () => {
    const { code } = await generateFor(parse('@for (child of item.children(); track child()) { <li></li> }'), 'root', '0', contextWith('item'), null);
    expect(code[0]).toContain('() => context.get(\'item\').children(),');
  });

  it('reads the item and the implicit variables as the parameters of the track function, resolving the members, the imports and the variables of the enclosing scopes', async () => {
    const context = contextWith('prefix');
    context.addImportedIdentifier('keyOf', '__keyOf');
    const { code } = await generateFor(parse('@for (item of items; track keyOf(item()) + prefix + separator + $index) { <li></li> }'), 'root', '0', context, null);

    expect(code[0]).toContain('(item, $index, $first, $last, $even, $odd) => __keyOf(item()) + context.get(\'prefix\') + this.separator + $index, for0.bind(this));');
  });

  it.each([
    ['10', '10'],
    ['numbers', 'this.numbers'],
    ['numbers()', 'this.numbers()']
  ])('generates a loop without item alias over %s', async (iterable, expected) => {
    const { code, functionsToProcess } = await generateFor(parse(`@for (${iterable}; track $index()) { <li></li> }`), 'root', '0', new GeneratorContext(cache), null);

    expect(code).toEqual([`_for(root, context, null, () => ${expected}, (_, $index, $first, $last, $even, $odd) => $index(), for0.bind(this));`]);
    expect(functionsToProcess?.get('for0')?.fn.precode).toBe('const entry = _iterationVariables(context, items0, i0);');
    expect(functionsToProcess?.get('for0')?.fn.declaration).toBeUndefined();
  });

  it('applies the aliases declared for implicit variables, reading a variable by the name the template writes', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item(); i = $index) { <li>{ i() }</li> }'), 'root', '0', new GeneratorContext(cache), null);
    const { declaration, context } = functionsToProcess!.get('for0')!.fn;

    expect(code[0]).toContain('(item, i, $first, $last, $even, $odd) => item(), for0.bind(this), for0Variables);');
    expect(declaration).toBe('const for0Variables = { used: [\'$index\'], names: [\'i\'] };');
    expect(context.getIdentifierKind('i')).toBe('signal');
    expect(context.getIdentifierKind('$index')).toBeUndefined();
  });

  describe('creates only the variables the body reads', () => {
    /**
     * Generates a @for and returns the variables the function of its body creates, its precode and its context.
     */
    const generateBody = async (template: string) => {
      const { fn } = (await generateFor(parse(template), 'root', '0', new GeneratorContext(cache), null)).functionsToProcess!.get('for0')!;
      const declaration = fn.declaration ?? '';
      return { created: /used: \[(.*?)\]/.exec(declaration)?.[1] ?? '', names: /names: \[(.*?)\]/.exec(declaration)?.[1], precode: fn.precode!, context: fn.context };
    };

    it('creates none when the body reads none, the track expression reading them as its parameters', async () => {
      const { created, precode, context } = await generateBody('@for (item of items(); track item().id + $index()) { <li>static</li> }');

      expect(created).toBe('');
      expect(precode).toBe('const entry = _iterationVariables(context, items0, i0);');
      expect(context.getIdentifierKind('item')).toBeUndefined();
      expect(context.getIdentifierKind('$index')).toBeUndefined();
    });

    it('creates only the item when the body reads only the item', async () => {
      const { created, names } = await generateBody('@for (item of items(); track item().id) { <li>{ item().name }</li> }');

      expect(created).toBe('\'item\'');
      expect(names).toBe('\'item\'');
    });

    it('creates $index read only by an event', async () => {
      const { created } = await generateBody('@for (item of items(); track item().id) { <button (click)="select($index())">x</button> }');
      expect(created).toBe('\'$index\'');
    });

    it('creates the item read only by the handler of an event, as the object the method is called on', async () => {
      const { created } = await generateBody('@for (item of items(); track item().id) { <button (click)="item.set(null)">x</button> }');
      expect(created).toBe('\'item\'');
    });

    it('creates $last read only inside a nested @if', async () => {
      const { created } = await generateBody('@for (item of items(); track item().id) { <li>@if (show()) { @if (!$last()) { <hr /> } }</li> }');
      expect(created).toBe('\'$last\'');
    });

    it('creates the variables read by their alias', async () => {
      const { created, names } = await generateBody('@for (item of items(); track item().id; i = $index, odd = $odd) { <li [class.odd]="{odd()}">{ i() }</li> }');

      expect(created).toBe('\'$index\', \'$odd\'');
      expect(names).toBe('\'i\', \'odd\'');
    });

    it('creates a variable read only by a template declared in the body', async () => {
      const { created } = await generateBody('@for (item of items(); track item().id) { <template row(label: string)><p>{ label() } { $even() }</p></template>@render row(\'x\') }');
      expect(created).toBe('\'$even\'');
    });

    it('creates a variable read only by the condition of a @case', async () => {
      const { created } = await generateBody('@for (item of items(); track item().id) { @switch (mode()) { @case ($first) { a } } }');
      expect(created).toBe('\'$first\'');
    });

    it('creates the variables of the outer @for read by a nested @for', async () => {
      const { created, names } = await generateBody('@for (row of rows(); track row().id) { <tr>@for (cell of row().cells; track cell().id) { <td>{ cell() } { $first() }</td> }</tr> }');

      expect(created).toBe('\'item\', \'$first\'');
      expect(names).toBe('\'row\', \'$first\'');
    });

    it('creates a variable whose name a nested @for or a @let declares again', async () => {
      const { created } = await generateBody('@for (item of items(); track item().id) { @let $odd = 1; { $odd() } @for (cell of cells(); track $index()) { { $index() } } }');
      expect(created).toBe('\'$index\', \'$odd\'');
    });
  });
});
