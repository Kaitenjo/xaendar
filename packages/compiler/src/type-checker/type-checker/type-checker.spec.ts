import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import { ComponentMetadata } from '../../types/component-metadata/component-metadata.type';
import { TypeChecker } from './type-checker';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('TypeChecker', () => {
  it('wraps the generated lines in a typeCheck function and maps them to the template', async () => {
    const template = '@import { A } from \'./a\'\nhello{name}';
    const { text, mappingTable } = await new TypeChecker(template, parse(template)).generate([]);

    expect(text).toBe('function typeCheck() {\n  root.name;\n}');
    expect([...mappingTable.keys()]).toEqual([1]);
  });

  it('resolves custom elements against the provided metadata', async () => {
    const template = '<my-el></my-el>';
    const component = { type: 'component', selectors: ['my-el'], properties: new Map(), events: new Map() } as unknown as ComponentMetadata;

    expect((await new TypeChecker(template, parse(template)).generate([component])).text).toBe('function typeCheck() {\n}');
  });

  it('prefixes errors with the type checker name', async () => {
    const template = '<my-el></my-el>';
    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toBeDefined();
  });

  it('reports nodes without a registered transition function', async () => {
    const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

    await expect(new TypeChecker('hello', ast).generate([])).rejects.toContain('[TypeChecker] No transition function for ASTNode of type Case');
  });
});
