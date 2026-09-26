import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ElseIfNode } from '../../types/nodes/else-if-node.type';
import { IfNode } from '../../types/nodes/if-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseIfControlFlow', () => {
  it('parses an if without alternate', () => {
    const [node] = parse('@if (a) { <b></b> }') as IfNode[];
    expect(node).toMatchObject({ type: ASTNodeType.If, condition: 'a', alternate: null });
    expect(node.children).toHaveLength(1);
  });

  it('parses an if / else if / else chain', () => {
    const [node] = parse('@if (a) { <b></b> } @else if (b) { <i></i> } @else { <u></u> }') as IfNode[];
    const elseIf = node.alternate as ElseIfNode;

    expect(elseIf).toMatchObject({ type: ASTNodeType.ElseIf, condition: 'b' });
    expect(elseIf.alternate).toMatchObject({ type: ASTNodeType.Else });
  });

  it('throws when the condition is missing', () => {
    const tokens: Token[] = [{ type: TokenType.IF, span: { start: 0, end: 3 } }];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected CONDITION after IF, got EOF');
  });
});
