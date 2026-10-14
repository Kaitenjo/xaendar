import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import type { TemplateError } from '../../models/template-error/template-error.model';
import { ComponentMetadata } from '../../types/component-metadata/component-metadata.type';
import { TypeChecker } from './type-checker';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('TypeChecker', () => {
  it('wraps the generated lines in a typeCheck function and maps them to the template', async () => {
    const template = '@import { A } from \'./a\'\nhello{name}';
    const { text, mappingTable } = await new TypeChecker(template, parse(template)).generate([], ['name']);

    expect(text).toBe('function typeCheck() {\n  root.name;\n}');
    expect([...mappingTable.keys()]).toEqual([1]);
  });

  it('resolves custom elements against the provided metadata', async () => {
    const template = '<my-el></my-el>';
    const component = { type: 'component', selector: 'my-el', properties: new Map(), events: new Map() } as unknown as ComponentMetadata;

    expect((await new TypeChecker(template, parse(template)).generate([component])).text).toBe('function typeCheck() {\n}');
  });

  it('prefixes errors with the type checker name', async () => {
    const template = '<my-el></my-el>';
    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toBeDefined();
  });

  it('reports nodes without a registered transition function', async () => {
    const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

    await expect(new TypeChecker('hello', ast).generate([])).rejects.toThrow('[TypeChecker] No transition function for ASTNode of type Case');
  });

  describe('generateTolerant', () => {
    const tolerant = (template: string, metadatas: ComponentMetadata[] = []) => new TypeChecker(template, parse(template)).generateTolerant(metadatas, ['name']);

    it('generates the same shim as generate when nothing fails', async () => {
      const template = '<p>{name}</p>';
      const { errors, ...result } = await tolerant(template);

      expect(errors).toEqual([]);
      expect(result).toEqual(await new TypeChecker(template, parse(template)).generate([], ['name']));
    });

    it('collects the error of every node failing instead of stopping at the first one', async () => {
      const template = '<a-a></a-a><b-b></b-b>{name}';
      const { errors, text } = await tolerant(template);

      expect(errors.map(({ message }) => message.split('\n')[0])).toEqual([
        '[TypeChecker] a-a selector is not associated to any WebComponent imported in the template, nor declared in customElements',
        '[TypeChecker] b-b selector is not associated to any WebComponent imported in the template, nor declared in customElements'
      ]);
      expect(errors.map(error => (error as TemplateError).span)).toEqual([{ start: 0, end: 11 }, { start: 11, end: 22 }]);
      expect(text).toBe('function typeCheck() {\n  root.name;\n}');
    });

    it('checks the children of an element failing, and the content of the blocks around the failing nodes', async () => {
      const template = '<a-a><b-b></b-b>{name}</a-a>@if (name) { <c-c></c-c> }';
      const { errors, text } = await tolerant(template);

      expect(errors.map(error => (error as TemplateError).span.start)).toEqual([0, 5, 41]);
      expect(text).toContain('root.name;');
    });

    it('skips the children of a block whose own check fails', async () => {
      const template = '@if (name) { <c-c></c-c> }';
      const checker = new TypeChecker(template, parse(template));
      (checker as unknown as { _states: Record<number, unknown> })._states[ASTNodeType.If] = () => {
        throw new Error('boom');
      };

      const { errors, text } = await checker.generateTolerant([]);

      expect(errors.map(({ message }) => message)).toEqual(['[TypeChecker] boom']);
      expect(text).toBe('function typeCheck() {\n}');
    });

    it('does not collect the errors of a later generate', async () => {
      const template = '<a-a></a-a>';
      const checker = new TypeChecker(template, parse(template));
      await checker.generateTolerant([]);

      await expect(checker.generate([])).rejects.toThrow('[TypeChecker] a-a selector is not associated');
    });

    it('still throws for nodes without a registered transition function', async () => {
      const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

      await expect(new TypeChecker('hello', ast).generateTolerant([])).rejects.toThrow('[TypeChecker] No transition function for ASTNode of type Case');
    });
  });
});
