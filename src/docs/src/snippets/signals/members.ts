import { count, readCount } from './store';

/**
 * A badge showing a count shared by the whole application.
 */
export class BadgeComponent extends CustomElement {
  /**
   * ✓ A module signal: TypeScript infers its type, and the compiler follows the import to the store.
   */
  public readonly count = count;
  /**
   * ✗ A call to a function of the application: text interpolations work, but attribute bindings
   * are evaluated only once, whatever the annotation of the member.
   */
  public readonly fromHelper = readCount();
}
