import { indent } from '@xaendar/common';
import { CompilerContext, toStringLiteral, type ASTNode, type ResolveExpressionOptions } from '@xaendar/compiler';
import type { ServerCodePiece } from '../../types/server-code-piece.type';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';

/**
 * The options the expressions of the code rendering on the server are resolved with: the globals of the browser are
 * read through `globalThis`, where they are `undefined` instead of throwing a `ReferenceError`.
 */
export const SERVER_RESOLVE_OPTIONS: Readonly<ResolveExpressionOptions> = { browserGlobals: 'globalThis' };

/**
 * Joins the pieces of the code of a function into its lines: the HTML and the expressions computing HTML following each
 * other are pushed into the output with a single `out.push(…)`, the adjacent HTML merged into one string literal, and
 * each statement is written on its own lines.
 *
 * @param pieces - The pieces, in order.
 * @returns The lines of code.
 */
export function toStatements(pieces: readonly ServerCodePiece[]): string[] {
  const lines = new Array<string>();
  const parts = new Array<string>();
  let html = '';

  const flushHtml = (): void => {
    if (html) {
      parts.push(toStringLiteral(html));
      html = '';
    }
  };

  const flush = (): void => {
    flushHtml();
    if (parts.length) {
      lines.push(`out.push(${parts.join(' + ')});`);
      parts.length = 0;
    }
  };

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    if ('html' in piece) {
      html = `${html}${piece.html}`;
    } else if ('value' in piece) {
      flushHtml();
      parts.push(piece.value);
    } else {
      flush();
      lines.push(...piece.statement.split('\n'));
    }
  }

  flush();
  return lines;
}

/**
 * Writes an array literal of lines of code: `[]` when there are none, the indented lines between brackets otherwise.
 *
 * @param lines - The lines of the items, each one ending with its comma.
 * @returns The lines of the array literal.
 */
export function toArrayLiteral(lines: string[]): string[] {
  return lines.length ? ['[', ...indent(lines), ']'] : ['[]'];
}

/**
 * Describes the function rendering a block of a control flow, `@if` and `@switch`: a scope of its own, whose nodes are
 * rendered where the control flow is.
 *
 * @param node - The node of the block.
 * @param key - The name of the function.
 * @param parent - Where the control flow is rendered.
 * @param compilerContext - The compiler context of the control flow.
 * @returns The function, taking the output and the runtime context of the control flow.
 */
export function toBlockFunction(node: Extract<ASTNode, { children: ASTNode[] }>, key: string, parent: ServerParent, compilerContext: CompilerContext): ServerFunctionToProcess {
  return {
    fn: { node, context: new CompilerContext(compilerContext), parent: { id: key, tag: parent.tag } },
    args: ['out', 'parentContext']
  };
}
