import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `computed-this.ts`, shown by the API reference of core-signals and the API reference of signals and the page signals/computed.
 */
export const COMPUTED_THIS: SourceFile = {
  name: 'computed-this.ts',
  lang: 'ts',
  code: `import { computed } from '@xaendar/core/signals';

/**
 * Inside a regular function, \`this\` is the underlying Signal.Computed.
 */
const total = computed(function () {
  console.log(Signal.subtle.introspectSources(this).length);
  return price() * quantity();
});

/**
 * Arrow functions have no \`this\` of their own: inside a class, \`this\` stays the component.
 */
const label = computed(() => \`\${this.first()} \${this.last()}\`);`
};
