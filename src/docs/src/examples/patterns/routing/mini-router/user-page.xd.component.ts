import { CustomElement, WebComponent, Property } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';
import { USERS } from './users';

/**
 * The page of a user, receiving the id read from the path.
 */
@WebComponent({
  selector: 'ex-user-page',
  templateUrl: './user-page.xd.component.html',
  styleUrl: './mini-router.css'
})
export class UserPageComponent extends CustomElement {
  /**
   * The id of the user, as written in the path.
   */
  @Property('', { alias: 'user' })
  public accessor userId!: InputSignal<string>;
  /**
   * The user, or undefined when the id is unknown.
   */
  public readonly person = computed(() => this._computePerson());

  /**
   * Computes the value of `person`.
   *
   * @returns The user, or undefined when the id is unknown.
   */
  private _computePerson(): (typeof USERS)[number] | undefined {
    return USERS.find(user => String(user.id) === this.userId());
  }
}
