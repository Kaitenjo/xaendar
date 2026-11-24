/**
 * Reports an error without stopping the code catching it: it is thrown again in a microtask, where the browser reports
 * it as an uncaught error, so that the work left (the other cleanups of a scope being cleared, the other host
 * directives of a component being destroyed) still runs.
 *
 * @param error - The error.
 */
export function reportError(error: unknown): void {
  queueMicrotask(() => {
    throw error;
  });
}
