import { _SSR_MARKERS } from '@xaendar/core';
import type { Function } from '@xaendar/types';
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
 * `<!--xd-t:1-->…<!--/xd-t-->` for the `@catch`. The content is rendered into an output of its own, dropped when it
 * throws, the code of the components it renders included. The error of the `@catch` goes through; a promise of an
 * asynchronous structural directive rejecting later is not caught.
 *
 * @param out - The output.
 * @param content - Renders the content into an output.
 * @param fallback - Renders the `@catch` into an output, with the error the content threw.
 * @throws The error of the `@catch`.
 */
export function _ssrTry(out: ServerOutput, content: Function<[output: ServerOutput], void>, fallback: Function<[output: ServerOutput, error: unknown], void>): void {
  let output: ServerOutput = [];
  let detail = CONTENT;
  try {
    content(output);
  } catch (error) {
    output = [];
    detail = CATCH;
    fallback(output, error);
  }

  out.push(`<!--${_SSR_MARKERS.try}:${detail}-->`);
  for (let i = 0; i < output.length; i++) {
    out.push(output[i]);
  }

  out.push(`<!--/${_SSR_MARKERS.try}-->`);
}
