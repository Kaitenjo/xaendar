import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A team card using two components that come from the same file.
 */
@WebComponent({
  selector: 'ex-team-card',
  templateUrl: './team-card.xd.component.html',
  styleUrl: './team-card.css'
})
export class TeamCardComponent extends CustomElement {
  /**
   * The members of the team.
   */
  public readonly members = [
    { name: 'Ada Lovelace', role: 'author' },
    { name: 'Grace Hopper', role: 'admin' },
    { name: 'Alan Turing', role: 'member' }
  ];
}
