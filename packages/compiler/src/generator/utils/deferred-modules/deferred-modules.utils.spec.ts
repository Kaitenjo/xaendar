import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { CompilerCache } from '../../../types/compiler-cache.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { getDeferredModules } from './deferred-modules.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

/**
 * A compiler context whose cache declares each component in the module its tag names, `<a-b>` in `/src/a.ts`, and
 * `<dir-x>` as a directive.
 */
const contextWithModules = () => {
  const context = new CompilerContext();
  const cache: CompilerCache = {
    getOrInsert: async selector => (selector === 'dir-x'
      ? { type: 'directive' }
      : { type: 'component', typescriptNodes: { klass: { getSourceFile: () => ({ fileName: `/src/${selector.split('-')[0]}.ts` }) } } }) as never,
    getImport: () => Promise.reject(new Error('No import')),
    set: () => undefined
  };
  context.cache = cache;
  return context;
};

/**
 * Finds the `@hydrate` nodes of a template, in the order they are written, nested ones included.
 */
const hydrateNodes = (nodes: readonly ASTNode[], found = new Array<HydrateNode>()): HydrateNode[] => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === ASTNodeType.Hydrate) {
      found.push(node);
    }
    if ('children' in node && Array.isArray(node.children)) {
      hydrateNodes(node.children as ASTNode[], found);
    }
  }

  return found;
};

describe('getDeferredModules', () => {
  it('finds the modules of the components only the content of a @hydrate renders, once each', async () => {
    const nodes = parse('<a-x></a-x><dir-x></dir-x>@hydrate (idle) { <b-x></b-x><b-y></b-y><c-x></c-x><a-y></a-y> }');
    const [hydrate] = hydrateNodes(nodes);

    expect(await getDeferredModules(nodes, contextWithModules())).toEqual(new Map([[hydrate, ['/src/b.ts', '/src/c.ts']]]));
  });

  it('leaves to the template the modules of the components it renders after a @hydrate too, and the ones of directives', async () => {
    const nodes = parse('@hydrate (visible) { <b-x></b-x><c-x></c-x><dir-x></dir-x> }<b-y></b-y>');
    const [hydrate] = hydrateNodes(nodes);

    expect(await getDeferredModules(nodes, contextWithModules())).toEqual(new Map([[hydrate, ['/src/c.ts']]]));
  });

  it('counts the content of a @client in the @hydrate holding it, not its @placeholder, which the browser does not render', async () => {
    const nodes = parse('@hydrate (idle) { @client { <b-x></b-x> } @placeholder { <c-x></c-x> } }');
    const [hydrate] = hydrateNodes(nodes);

    expect(await getDeferredModules(nodes, contextWithModules())).toEqual(new Map([[hydrate, ['/src/b.ts']]]));
  });

  it('leaves the components of a @hydrate inside another one to the inner one, through every block', async () => {
    const template = [
      '@hydrate (idle) {',
      '  <p><b-x></b-x></p>',
      '  @if (a) { <c-x></c-x> } @else if (b) { <d-x></d-x> } @else { <e-x></e-x> }',
      '  @for (item of items; track item()) { <f-x></f-x> }',
      '  @switch (a) { @case (1) { <g-x></g-x> } @default { <h-x></h-x> } }',
      '  <template row()><i-x></i-x></template>',
      '  { text } @let total = 1; @render row()',
      '  @hydrate (load) { <j-x></j-x><b-y></b-y> }',
      '}'
    ].join('\n');
    const nodes = parse(template);
    const [outer, inner] = hydrateNodes(nodes);

    expect(await getDeferredModules(nodes, contextWithModules())).toEqual(new Map([
      [outer, ['/src/b.ts', '/src/c.ts', '/src/d.ts', '/src/e.ts', '/src/f.ts', '/src/g.ts', '/src/h.ts', '/src/i.ts']],
      [inner, ['/src/j.ts', '/src/b.ts']]
    ]));
  });

  it('leaves the custom elements of other libraries to the template', async () => {
    const context = contextWithModules();
    context.addCustomElementPatterns('sl-*');
    const nodes = parse('@hydrate (idle) { <sl-button></sl-button> }');

    expect(await getDeferredModules(nodes, context)).toBeUndefined();
  });

  it('finds none without a @hydrate, or without the cache of the metadata', async () => {
    expect(await getDeferredModules(parse('<a-x></a-x>'), contextWithModules())).toBeUndefined();
    expect(await getDeferredModules(parse('@hydrate (idle) { <a-x></a-x> }'), new CompilerContext())).toBeUndefined();
  });
});
