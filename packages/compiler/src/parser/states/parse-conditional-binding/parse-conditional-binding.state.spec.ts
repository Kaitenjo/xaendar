import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ElementNode } from '../../types/nodes/element-node.type';
import { IfBindingNode } from '../../types/nodes/if-binding-node.type';
import { SwitchBindingNode } from '../../types/nodes/switch-binding-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];
const parseTokens = (...tokens: Token[]) => new Parser('', [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } }, ...tokens]).parse();

const ifToken: Token = { type: TokenType.IF, span: { start: 5, end: 8 } };
const switchToken: Token = { type: TokenType.SWITCH, span: { start: 5, end: 12 } };
const condition: Token = { type: TokenType.CONDITION, parts: ['cond()'], span: { start: 12, end: 20 } };
const blockOpen: Token = { type: TokenType.BLOCK_OPEN, span: { start: 20, end: 22 } };
const blockClose: Token = { type: TokenType.BLOCK_CLOSE, span: { start: 22, end: 24 } };
const text: Token = { type: TokenType.TEXT, parts: ['x'], span: { start: 24, end: 25 } };

describe('parseConditionalBinding', () => {
  describe('@if', () => {
    it('parses the attributes, events and nested conditional bindings of a branch', () => {
      const [node] = parse('<div @if (cond()) { title="x" @click="f()" @if (inner()) { id="y" } }></div>');
      const [binding] = node.conditionalBindings as IfBindingNode[];
      const [branch] = binding.branches;

      expect(binding.type).toBe(ASTNodeType.IfBinding);
      expect(binding.branches).toHaveLength(1);
      expect(branch.type).toBe(ASTNodeType.ConditionalBindingBranch);
      expect(branch.condition?.getText()).toBe('cond()');
      expect(branch.attributes.map(({ name }) => name)).toEqual(['title']);
      expect(branch.events.map(({ name }) => name)).toEqual(['click']);
      expect(branch.conditionalBindings).toHaveLength(1);
      expect(branch.directives).toEqual([]);
    });

    it('parses the @else if and @else branches in declaration order', () => {
      const [node] = parse('<div @if (a()) { title="x" } @else if (b()) { title="y" } @else if (c()) { title="z" } @else { title="w" } class="k"></div>');
      const [binding] = node.conditionalBindings as IfBindingNode[];

      expect(node.conditionalBindings).toHaveLength(1);
      expect(node.attributes.map(({ name }) => name)).toEqual(['class']);
      expect(binding.branches.map(({ condition }) => condition?.getText() ?? null)).toEqual(['a()', 'b()', 'c()', null]);
      expect(binding.branches.map(({ attributes }) => attributes[0].value)).toEqual(['x', 'y', 'z', 'w']);
    });

    it('parses a chain without @else', () => {
      const [node] = parse('<div @if (a()) { title="x" } @else if (b()) { title="y" }></div>');
      const [binding] = node.conditionalBindings as IfBindingNode[];

      expect(binding.branches.map(({ condition }) => condition?.getText())).toEqual(['a()', 'b()']);
    });

    it('starts a new conditional binding at every @if', () => {
      const [node] = parse('<div @if (a()) { title="x" } @if (b()) { id="y" } @else { id="z" }></div>');

      expect(node.conditionalBindings.map(({ branches }) => branches.length)).toEqual([1, 2]);
    });

    it('spans from the @if to the end of the last branch, each branch spanning from its keyword to the end of its block', () => {
      const template = '<div @if (a()) { title="x" } @else { title="y" } class="k"></div>';
      const [node] = parse(template);
      const [binding] = node.conditionalBindings;

      expect(binding.span).toEqual({ start: template.indexOf('@if'), end: template.lastIndexOf('}') + 1 });
      expect(binding.branches.map(({ span }) => span)).toEqual([
        { start: template.indexOf('@if'), end: template.indexOf('}') + 1 },
        { start: template.indexOf('@else'), end: template.lastIndexOf('}') + 1 }
      ]);
    });

    it('throws when a condition is not a valid expression', () => {
      expect(() => parse('<div @if (a = 1) { title="x" }></div>')).toThrow('is not allowed inside template expressions');
    });

    it.each([
      ['@if', [ifToken, blockOpen], 'Expected CONDITION after IF, got BLOCK_OPEN'],
      ['@else if', [ifToken, condition, blockOpen, blockClose, { type: TokenType.ELSE_IF, span: { start: 24, end: 32 } } as Token], 'Expected CONDITION after ELSE_IF, got EOF']
    ])('throws when the condition of an %s is missing', (_keyword, tokens, message) => {
      expect(() => parseTokens(...tokens)).toThrow(message);
    });
  });

  describe('@switch', () => {
    it('parses the @case branches, the ones sharing a block and the @default one', () => {
      const [node] = parse('<div @switch (mode()) { @case (\'a\') @case (\'b\') { title="x" } @case (1) { title="y" @click="f()" } @default { @if (inner()) { id="z" } } }></div>');
      const [binding] = node.conditionalBindings as SwitchBindingNode[];

      expect(binding.type).toBe(ASTNodeType.SwitchBinding);
      expect(binding.expression.getText()).toBe('mode()');
      expect(binding.branches.map(({ type }) => type)).toEqual(new Array(3).fill(ASTNodeType.ConditionalBindingBranch));
      expect(binding.branches.map(({ condition }) => condition)).toEqual([['\'a\'', '\'b\''], ['1'], null]);
      expect(binding.branches.map(({ attributes }) => attributes.map(({ name }) => name))).toEqual([['title'], ['title'], []]);
      expect(binding.branches[1].events).toHaveLength(1);
      expect(binding.branches[2].conditionalBindings).toHaveLength(1);
    });

    it('parses a switch without branches', () => {
      const [node] = parse('<div @switch (mode()) { }></div>');

      expect(node.conditionalBindings[0].branches).toEqual([]);
    });

    it('spans from the @switch to the end of its block, each branch spanning from its first keyword to the end of its block', () => {
      const template = '<div @switch (mode()) { @case (1) @case (2) { title="x" } @default { title="y" } } class="k"></div>';
      const [node] = parse(template);
      const [binding] = node.conditionalBindings;

      expect(binding.span).toEqual({ start: template.indexOf('@switch'), end: template.lastIndexOf('}') + 1 });
      expect(binding.branches.map(({ span }) => span)).toEqual([
        { start: template.indexOf('@case'), end: template.indexOf('}') + 1 },
        { start: template.indexOf('@default'), end: template.lastIndexOf('}', template.lastIndexOf('}') - 1) + 1 }
      ]);
    });

    it('throws when the expression is missing', () => {
      expect(() => parseTokens(switchToken, blockOpen)).toThrow('Expected CONDITION after SWITCH, got BLOCK_OPEN');
    });

    it('throws when a @case has no condition', () => {
      const tokens = [switchToken, condition, blockOpen, { type: TokenType.CASE, span: { start: 22, end: 27 } } as Token, blockOpen];
      expect(() => parseTokens(...tokens)).toThrow('Expected CONDITION after CASE, got BLOCK_OPEN');
    });

    it('throws for anything but @case and @default branches, and for the end of the template, instead of looping', () => {
      expect(() => parse('<div @switch (mode()) { title="x" }></div>')).toThrow('Unexpected ATTRIBUTE inside SWITCH, expected CASE or DEFAULT');
      expect(() => parseTokens(switchToken, condition, blockOpen)).toThrow('Unexpected EOF inside SWITCH, expected CASE or DEFAULT');
    });

    it.each([
      ['a @case', '<div @switch (mode()) { @default { title="x" } @case (1) { title="y" } }></div>'],
      ['another @default', '<div @switch (mode()) { @default { title="x" } @default { title="y" } }></div>']
    ])('throws when %s is declared after the @default branch', (_description, template) => {
      expect(() => parse(template)).toThrow('@default must be the last branch of a @switch');
    });
  });

  it('parses the directives applied inside a conditional binding', () => {
    const [node] = parse('<div @if (cond()) { title="x" @@first @@second(display="block") @if (inner()) { @@third } } @else { @@fourth}></div>');
    const [binding] = node.conditionalBindings;
    const [branch, elseBranch] = binding.branches;

    expect(node.directives).toEqual([]);
    expect(branch.attributes.map(({ name }) => name)).toEqual(['title']);
    expect(branch.directives.map(({ selector }) => selector)).toEqual(['first', 'second']);
    expect(branch.directives[1].attributes.map(({ name }) => name)).toEqual(['display']);
    expect(branch.conditionalBindings[0].branches[0].directives.map(({ selector }) => selector)).toEqual(['third']);
    expect(elseBranch.directives.map(({ selector }) => selector)).toEqual(['fourth']);
  });

  it('throws when the block of a branch is not opened', () => {
    expect(() => parseTokens(ifToken, condition, text)).toThrow('Expected BLOCK_OPEN, got TEXT');
  });

  it('throws on an unexpected token inside a branch, and on the end of the template, instead of looping', () => {
    expect(() => parseTokens(ifToken, condition, blockOpen, text)).toThrow('Unexpected TEXT in conditional binding');
    expect(() => parseTokens(ifToken, condition, blockOpen)).toThrow('Unexpected EOF in conditional binding');
  });

  it('throws on a misplaced flow-control keyword', () => {
    expect(() => parse('<div @if (a()) { @else { title="x" } }></div>')).toThrow('Unexpected ELSE in conditional binding');
    expect(() => parse('<div @if (a()) { @case (1) { title="x" } }></div>')).toThrow('Unexpected CASE in conditional binding');
  });
});
