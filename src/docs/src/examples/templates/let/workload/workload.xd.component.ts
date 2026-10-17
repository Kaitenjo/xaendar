import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The tasks of a member of the team.
 */
type Stats = {
  /**
   * The number of tasks still open.
   */
  readonly open: number;
  /**
   * The number of tasks done.
   */
  readonly done: number;
};

/**
 * A member of the team, with their tasks.
 */
type Member = {
  /**
   * The identifier of the member, which the rows are tracked by.
   */
  readonly id: number;
  /**
   * The name of the member.
   */
  readonly name: string;
  /**
   * The tasks of the member.
   */
  readonly stats: Stats;
};

/**
 * Gives every row of a `@for` its own `@let`, naming a part of the item of the row.
 */
@WebComponent({
  selector: 'ex-workload',
  styleUrl: './workload.css',
  templateUrl: './workload.xd.component.html'
})
export class WorkloadComponent extends CustomElement {
  /**
   * The members of the team, one per row.
   */
  public readonly members = signal<Member[]>([
    { id: 1, name: 'Ada', stats: { open: 2, done: 1 } },
    { id: 2, name: 'Linus', stats: { open: 3, done: 0 } },
    { id: 3, name: 'Grace', stats: { open: 1, done: 4 } }
  ]);

  /**
   * Marks an open task of a member as done.
   *
   * @param id - The identifier of the member.
   */
  public complete(id: number): void {
    this.members.update(members => members.map(member => (member.id === id && member.stats.open ? { ...member, stats: { open: member.stats.open - 1, done: member.stats.done + 1 } } : member)));
  }
}
