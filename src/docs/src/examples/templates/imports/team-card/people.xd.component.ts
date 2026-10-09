import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A round avatar with the initials of a name.
 */
@WebComponent({
  selector: 'ex-avatar',
  templateUrl: './avatar.xd.component.html',
  styleUrl: './people.css'
})
export class AvatarComponent extends CustomElement {
  /**
   * The name to take the initials from, bound as full-name.
   */
  @Property('', { alias: 'full-name' })
  public accessor fullName!: InputSignal<string>;
  /**
   * The initials.
   */
  public readonly initials = computed(() => this._computeInitials());

  /**
   * Computes the value of `initials`.
   *
   * @returns The initials.
   */
  private _computeInitials(): string {
    return this.fullName().split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  }
}

/**
 * A badge with a role. Declared in the same file as the avatar: one @import brings both.
 */
@WebComponent({
  selector: 'ex-role-badge',
  templateUrl: './role-badge.xd.component.html',
  styleUrl: './people.css'
})
export class RoleBadgeComponent extends CustomElement {
  /**
   * The role, bound as role: a member named role would clash with the role property of Element.
   */
  @Property('member', { alias: 'role' })
  public accessor roleName!: InputSignal<string>;
}
