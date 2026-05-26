/**
 * Generates the content for a new Signal.ts file.
 * @returns The formatted TypeScript source string.
 */
export function signalTs(): string {
  return `import { loadSignals } from "@xaendar/signals";

loadSignals();`;
}