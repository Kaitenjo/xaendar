import { CompilerContext, parseTemplate, type IfNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { SERVER_RESOLVE_OPTIONS, toArrayLiteral, toBlockFunction, toStatements } from './server-code.utils';

describe('toStatements', () => {
  it('pushes the HTML and the values following each other together, merging the adjacent HTML', () => {
    expect(toStatements([{ html: '<p>' }, { html: 'a\'b' }, { value: '_escapeText(x)' }, { html: '</p>' }])).toEqual([
      'out.push(\'<p>a\\\'b\' + _escapeText(x) + \'</p>\');'
    ]);
  });

  it('writes a statement on its own lines, pushing what precedes it first', () => {
    expect(toStatements([{ value: 'a' }, { statement: 'if (x) {\n  y();\n}' }, { html: '<br>' }])).toEqual([
      'out.push(a);',
      'if (x) {',
      '  y();',
      '}',
      'out.push(\'<br>\');'
    ]);
  });

  it('writes nothing for no piece', () => {
    expect(toStatements([])).toEqual([]);
  });
});

describe('toArrayLiteral', () => {
  it('writes the lines between brackets, indented', () => {
    expect(toArrayLiteral(['a,', 'b,'])).toEqual(['[', '  a,', '  b,', ']']);
  });

  it('writes an empty array literal for no line', () => {
    expect(toArrayLiteral([])).toEqual(['[]']);
  });
});

describe('toBlockFunction', () => {
  it('describes a scope of its own rendered where the control flow is, taking the output and the context', () => {
    const node = parseTemplate('@if (x) { a }')[0] as IfNode;
    const compilerContext = new CompilerContext();

    const { fn, args } = toBlockFunction(node, 'if0', { id: 'root', tag: 'ul' }, compilerContext);

    expect(fn.node).toBe(node);
    expect(fn.parent).toEqual({ id: 'if0', tag: 'ul' });
    expect(fn.context).not.toBe(compilerContext);
    expect(args).toEqual(['out', 'parentContext']);
  });
});

describe('SERVER_RESOLVE_OPTIONS', () => {
  it('reads the globals of the browser through globalThis', () => {
    expect(SERVER_RESOLVE_OPTIONS).toEqual({ browserGlobals: 'globalThis' });
  });
});
