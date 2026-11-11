import { _SSR_MARKERS, type _Context } from '@xaendar/core';
import type { ServerOutput } from '../../types/server-output.type';

/**
 * The detail of the marker of a `@try` whose content is rendered.
 */
const CONTENT = '0';

/**
 * The detail of the marker of a `@try` whose `@catch` is rendered.
 */
const CATCH = '1';

/**
 * Renders a `@try` block on the server: its content, or, when it throws, its `@catch` with the error, as in JavaScript,
 * between the markers the browser finds the block by, `<!--xd-t:0-->…<!--/xd-t-->` for the content and
 * `<!--xd-t:1-->…<!--/xd-t-->` for the `@catch`, the closing one left out for the last node of its parent. The content is rendered into an output of its own, dropped when it
 * throws, the code of the components it renders included. The error of the `@catch` goes through; a promise of an
 * asynchronous structural directive rejecting later is not caught.
 *
 * The content and the `@catch` are functions of the module of the template, called with the component as `this`, the
 * output and the context of the scope holding the block, and, for the `@catch`, the error.
 *
 * @param out - The output.
 * @param context - The runtime context of the scope holding the block.
 * @param content - Renders the content into an output.
 * @param fallback - Renders the `@catch` into an output, with the error the content threw.
 * @param last - Whether the block is the last node of its parent, written without the marker closing it, as the client
 *   renders it without anchor.
 * @throws The error of the `@catch`.
 */
export function _ssrTry(out: ServerOutput, context: _Context, content: (this: unknown, output: ServerOutput, context: _Context) => void, fallback: (this: unknown, output: ServerOutput, context: _Context, error: unknown) => void, last = false): void {
  const { component } = context;
  let output: ServerOutput = [];
  let detail = CONTENT;
  try {
    content.call(component, output, context);
  } catch (error) {
    output = [];
    detail = CATCH;
    fallback.call(component, output, context, error);
  }

  out.push(`<!--${_SSR_MARKERS.try}:${detail}-->`);
  for (let i = 0; i < output.length; i++) {
    out.push(output[i]);
  }

  if (!last) {
    out.push(`<!--/${_SSR_MARKERS.try}-->`);
  }
}
