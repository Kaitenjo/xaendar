import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { ImportNode } from '../../../parser/types/nodes/import-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckImport } from './type-check-import.state';

const processNode: ProcessNode = () => [];

/**
 * Type-checks the `@import` of a template whose specifiers all import symbols of `/src/utils.ts`, but `Card`, a component.
 */
const run = (template: string) => {
  const node = new Parser(template, new Lexer(template).tokenize()).parse()[0] as ImportNode;
  const context = new TypeCheckContext();
  context.addSymbolImport(...node.specifiers.filter(({ local }) => local !== 'Card').map(specifier => ({ ...specifier, type: 'symbol' as const, modulePath: '/src/utils.ts', reactive: false })));

  return { lines: typeCheckImport(node, processNode, new TypeCheckContext(context)), context };
};

describe('typeCheckImport', () => {
  it('imports each symbol under its own name, with its names mapped onto the template, and nothing for a component', () => {
    const template = '@import { formatDate, Status as State, default as fmt, * as utils, Card } from \'./utils\'';
    const { lines } = run(template);

    expect(lines.map(({ text }) => text)).toEqual([
      'import { formatDate } from \'/src/utils\';',
      'import { Status as State } from \'/src/utils\';',
      'import { default as fmt } from \'/src/utils\';',
      'import * as utils from \'/src/utils\';'
    ]);
    expect(lines.map(({ text, mappings }) => mappings!.map(({ columnStart, columnEnd, original }) => [text.slice(columnStart, columnEnd), template.slice(original.start, original.end)]))).toEqual([
      [['formatDate', 'formatDate']],
      [['Status', 'Status'], ['State', 'State']],
      [['default', 'default'], ['fmt', 'fmt']],
      [['utils', 'utils']]
    ]);
  });

  it('lets the expressions read the symbols as written', () => {
    const { context } = run('@import { formatDate } from \'./utils\'');

    expect(context.getImportedIdentifier('formatDate')).toEqual({ expression: 'formatDate', kind: 'value', used: false });
  });

  it('throws for a symbol imported under a name the generated code reserves', () => {
    expect(() => run('@import { x as root } from \'./utils\'')).toThrow('"root" is reserved in templates');
  });
});
