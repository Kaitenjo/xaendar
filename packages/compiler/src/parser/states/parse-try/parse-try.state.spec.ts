import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TemplateError } from '../../../models/template-error/template-error.model';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { TryNode } from '../../types/nodes/try-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

/**
 * The error of a template, as its message and the text of the template it points to.
 */
const failure = (template: string) => {
  try {
    parse(template);
  } catch (error) {
    const { detail, span } = error as TemplateError;
    return [detail, template.slice(span.start, span.end)];
  }

  return undefined;
};

describe('parseTry', () => {
  it.each([
    ['on the same line', '@try { <b></b> } @catch (error) { <i></i> }'],
    ['on another line', '@try {\n  <b></b>\n}\n@catch (error) {\n  <i></i>\n}']
  ])('parses the content and the @catch following it %s, with the name of the error', (_case, template) => {
    const [node] = parse(template) as TryNode[];

    expect(node).toMatchObject({ type: ASTNodeType.Try, span: { start: 0, end: template.length } });
    expect(node.children).toHaveLength(1);
    expect(node.catch).toMatchObject({ type: ASTNodeType.Catch, name: 'error', span: { start: template.indexOf('@catch'), end: template.length } });
    expect(template.slice(node.catch.nameSpan!.start, node.catch.nameSpan!.end)).toBe('error');
    expect(node.catch.children).toHaveLength(1);
  });

  it('locates the name of the error among the spaces around it', () => {
    const template = '@try { a } @catch (  failure  ) { b }';
    const [node] = parse(template) as TryNode[];

    expect(template.slice(node.catch.nameSpan!.start, node.catch.nameSpan!.end)).toBe('failure');
  });

  it('parses a @catch without a name, as catch {} in JavaScript', () => {
    const [node] = parse('@try { a } @catch { b }') as TryNode[];

    expect(node.catch).not.toHaveProperty('name');
    expect(node.catch).not.toHaveProperty('nameSpan');
    expect(node.catch.children).toHaveLength(1);
  });

  it('leaves what follows the @catch to the nodes after the block', () => {
    expect(parse('@try { a } @catch { b } <i></i>')).toHaveLength(2);
  });

  it.each([
    ['without a @catch', '@try { a }'],
    ['followed by another node', '@try { a } <b></b>'],
    ['followed by a text before the @catch', '@try { a } text @catch { b }']
  ])('rejects a @try %s, on its keyword', (_case, template) => {
    expect(failure(template)).toEqual(['@try needs a @catch: write @catch (error) { … } right after its block', '@try ']);
  });

  it.each([
    ['without a @try', '<p>a</p>@catch { b }'],
    ['after another block', '@if (a) { b } @catch { c }'],
    ['after another @catch', '@try { a } @catch { b } @catch { c }']
  ])('rejects a @catch %s', (_case, template) => {
    expect(failure(template)?.[0]).toBe('@catch must follow the block of a @try');
  });

  it.each([
    ['an expression', '@try { a } @catch (error.message) { b }', 'error.message', '\'error.message\' is not a valid name for a @catch error: it must be an identifier.'],
    ['a destructuring', '@try { a } @catch ({ message }) { b }', '{ message }', '\'{ message }\' is not a valid name for a @catch error: it must be an identifier.'],
    ['a reserved name', '@try { a } @catch ($event) { b }', '$event', '\'$event\' is reserved in templates: give the @catch error another name.']
  ])('rejects %s as the name of the error, on the name', (_case, template, name, message) => {
    expect(failure(template)).toEqual([message, name]);
  });

  it('rejects empty parentheses, as JavaScript does', () => {
    expect(failure('@try { a } @catch () { b }')?.[0]).toBe('\'\' is not a valid name for a @catch error: it must be an identifier.');
  });
});
