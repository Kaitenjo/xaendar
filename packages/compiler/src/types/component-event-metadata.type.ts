import type { MemberDeclaration } from './member-declaration.type';

/**
 * Represents a component event with metadata from @Event decorator.
 */
export type ComponentEventMetadata = {
  /**
   * Detail type emitted by the event.
   */
  type: string;
  /**
   * Where the `@Event` accessor is declared: in the class itself, or in one of its base classes.
   */
  declaration?: MemberDeclaration;
};
