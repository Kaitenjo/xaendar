import { toPascalCase } from "../../generate/component/component.command";

/**
 * Generates the content of the project entry point `src/main.ts`.
 *
 * Calls `loadSignals()` from `@xaendar/signals` to initialise the signal
 * runtime before any component is registered, then imports the root
 * component so its `@Component` decorator runs and registers the custom
 * element with the browser.
 *
 * @param selector - The root component selector derived from the project
 *   name (e.g. `app` → `'./app/app.component.js'`).
 * @returns The formatted TypeScript source string.
 */
export function mainTs(componentName: string): string {
  const componentClassName = `${toPascalCase(componentName)}Component`;
  return `import { loadSignals } from '@xaendar/signals';
import { ${componentClassName} } from './${componentName}/${componentName}.xd.component';

console.log(${componentClassName});
loadSignals();
`;
}
