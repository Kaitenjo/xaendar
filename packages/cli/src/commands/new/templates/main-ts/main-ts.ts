/**
 * Generates the content of the project entry point `src/main.ts`.
 *
 * It installs the Signal polyfill, then loads `bootstrap.ts` on demand: the modules of `@xaendar/core`
 * need the polyfill as soon as they are evaluated, so they must not be imported statically.
 *
 * @returns The formatted TypeScript source string.
 */
export function mainTs(): string {
  return `import { loadSignals } from '@xaendar/signals';

loadSignals();
await import('./bootstrap');`;
}
