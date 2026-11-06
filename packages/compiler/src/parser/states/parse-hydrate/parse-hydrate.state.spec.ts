import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { HydrateNode } from '../../types/nodes/hydrate-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseHydrate', () => {
  it('parses the triggers and the content', () => {
    const template = '@hydrate (idle, when ready()) { <b></b> }';
    const [node] = parse(template) as HydrateNode[];

    expect(node).toMatchObject({ type: ASTNodeType.Hydrate, span: { start: 0, end: template.length } });
    expect(node.triggers.map(({ kind }) => kind)).toEqual(['idle', 'when']);
    expect(node.children).toHaveLength(1);
  });

  it('accepts the triggers watching the content without anything else', () => {
    const [node] = parse('@hydrate (visible, interaction) { text }') as HydrateNode[];

    expect(node.triggers.map(({ kind }) => kind)).toEqual(['visible', 'interaction']);
  });

  it('parses a @hydrate without triggers, which waits for the browser to be idle', () => {
    const template = '@hydrate { <b></b> }';
    const [node] = parse(template) as HydrateNode[];

    expect(node).toMatchObject({ type: ASTNodeType.Hydrate, triggers: [], prefetch: [], span: { start: 0, end: template.length } });
    expect(node.children).toHaveLength(1);
  });

  it('parses the triggers loading the modules of the content apart from the ones hydrating it', () => {
    const [node] = parse('@hydrate (interaction, prefetch idle(500)) { <b></b> }') as HydrateNode[];

    expect(node.triggers.map(({ kind }) => kind)).toEqual(['interaction']);
    expect(node.prefetch).toMatchObject([{ kind: 'idle', timeout: 500 }]);
  });
});
