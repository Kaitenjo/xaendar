declare module '*.vue' {
  import type { Component } from 'vue';

  /**
   * The component declared by a single file component, so TypeScript accepts the import of a `.vue` file.
   */
  const component: Component;

  export default component;
}
