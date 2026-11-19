import { indent } from '@xaendar/common';
import { GeneratorContext, toStringLiteral, type ASTNode, type ResolveExpressionOptions } from '@xaendar/compiler';
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

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    if ('html' in piece) {
      html = `${html}${piece.html}`;
    } else if ('value' in piece) {
      pushHtml(parts, html);
      html = '';
      parts.push(piece.value);
    } else {
      pushHtml(parts, html);
      html = '';
      pushOutput(lines, parts);
      lines.push(...piece.statement.split('\n'));
    }
  }

  pushHtml(parts, html);
  pushOutput(lines, parts);
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
 * @param generatorContext - The generator context of the control flow.
 * @param last - Whether the control flow is the last node of its parent: its content ends where the parent does.
 * @returns The function, taking the output and the runtime context of the control flow.
 */
export function toBlockFunction(node: Extract<ASTNode, { children: ASTNode[] }>, key: string, parent: ServerParent, generatorContext: GeneratorContext, last: boolean): ServerFunctionToProcess {
  return {
    fn: { node, context: new GeneratorContext(generatorContext), parent: { id: key, tag: parent.tag, end: last } },
    args: ['out', 'parentContext']
  };
}

/**
 * Adds the HTML following the last part pushed into the output to the parts, as a string literal.
 *
 * @param parts - The parts of the next `out.push(…)`.
 * @param html - The HTML, empty for none.
 */
function pushHtml(parts: string[], html: string): void {
  if (html) {
    parts.push(toStringLiteral(html));
  }
}

/**
 * Writes the parts collected into a single `out.push(…)`, then forgets them.
 *
 * @param lines - The lines of code.
 * @param parts - The parts, emptied.
 */
function pushOutput(lines: string[], parts: string[]): void {
  if (parts.length) {
    lines.push(`out.push(${parts.join(' + ')});`);
    parts.length = 0;
  }
}
