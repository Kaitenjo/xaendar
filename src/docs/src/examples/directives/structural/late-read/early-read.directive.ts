import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Reads its input first, then waits.
 */
@Directive({ selector: 'exEarlyRead' })
export class EarlyReadDirective extends StructuralDirective {
  /**
   * The user to check.
   */
  @Property('')
  public accessor user!: InputSignal<string>;

  /**
   * @returns Whether the user is the admin, read before a pause.
   */
  public async shouldRender(): Promise<boolean> {
    const user = this.user();
    await new Promise(resolve => setTimeout(resolve, 100));
    return user === 'admin';
  }
}
