import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Waits before reading its input: the input is read outside of the tracking, so its changes are missed.
 */
@Directive({ selector: 'exLateRead' })
export class LateReadDirective extends StructuralDirective {
  /**
   * The user to check.
   */
  @Property('')
  public accessor user!: InputSignal<string>;

  /**
   * @returns Whether the user is the admin, read after a pause.
   */
  public async shouldRender(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.user() === 'admin';
  }
}
