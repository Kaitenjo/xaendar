import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { canSeeAdminPanel } from './permissions';

/**
 * Renders the element when the server allows the user.
 */
@Directive({ selector: 'exAllowedUser' })
export class AllowedUserDirective extends StructuralDirective {
  /**
   * The user to check.
   */
  @Property('')
  public accessor user!: InputSignal<string>;

  /**
   * Reads the input before awaiting: only the signals read before the first await are tracked.
   *
   * @returns Whether the user is allowed.
   */
  public async shouldRender(): Promise<boolean> {
    const user = this.user();
    return await canSeeAdminPanel(user);
  }
}
