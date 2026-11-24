import type { InterfaceDeclaration } from 'typescript';

/**
 * What the compiler reads of the DOM library of the TypeScript of the project (`lib.dom.d.ts`).
 */
export type DomLibrary = {
  /**
   * The declarations of each interface, by name: the library merges several declarations of some of them.
   */
  readonly interfaces: ReadonlyMap<string, readonly InterfaceDeclaration[]>;
  /**
   * The name of the class of each native HTML element, by tag (`button` → `HTMLButtonElement`), as
   * `HTMLElementTagNameMap` declares them.
   */
  readonly tagClasses: ReadonlyMap<string, string>;
};
