import type { Span } from '../span.type';

/**
 * Where a member of a class is declared, e.g. the accessor of a `@Property` or of an `@Event`, inherited ones included.
 */
export type MemberDeclaration = {
  /**
   * The path of the file declaring the member.
   */
  readonly fileName: string;
  /**
   * The span of the name of the member in that file.
   */
  readonly span: Span;
};
