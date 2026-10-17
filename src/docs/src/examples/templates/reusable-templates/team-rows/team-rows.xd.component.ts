import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Member } from './member.type';

/**
 * Renders a row template from a `@for`, passing it the item and the index of the loop.
 */
@WebComponent({
  selector: 'ex-team-rows',
  styleUrl: './team-rows.css',
  templateUrl: './team-rows.xd.component.html'
})
export class TeamRowsComponent extends CustomElement {
  /**
   * The members of the team, one per row.
   */
  public readonly members = signal<Member[]>([
    { id: 1, name: 'Ada', role: 'Design' },
    { id: 2, name: 'Grace', role: 'Build' },
    { id: 3, name: 'Linus', role: 'Review' }
  ]);

  /**
   * Moves the last member to the top: the rows move with their instances, which receive their new position.
   */
  public promote(): void {
    this.members.update(members => [members[members.length - 1], ...members.slice(0, -1)]);
  }
}
