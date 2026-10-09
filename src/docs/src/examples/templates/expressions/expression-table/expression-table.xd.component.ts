import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Evaluates one expression of each kind a template accepts, on state that the buttons change.
 */
@WebComponent({
  selector: 'ex-expression-table',
  templateUrl: './expression-table.xd.component.html',
  styleUrl: './expression-table.css'
})
export class ExpressionTableComponent extends CustomElement {
  /**
   * A number.
   */
  public readonly count = signal(3);
  /**
   * A string.
   */
  public readonly name = signal('ada');
  /**
   * An object that can be missing.
   */
  public readonly user = signal<{ name: string; tags: string[] } | null>({ name: 'Ada', tags: ['admin', 'author'] });
  /**
   * A value that can be missing.
   */
  public readonly nickname = signal<string | null>(null);
  /**
   * A dictionary.
   */
  public readonly prices = { tea: 2, coffee: 3 };
  /**
   * A function that can be missing.
   */
  public readonly greet: ((name: string) => string) | undefined = name => `Hi, ${name}`;

  /**
   * Adds one to the count.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }

  /**
   * Removes the user, or brings it back.
   */
  public toggleUser(): void {
    this.user.update(user => user ? null : { name: 'Ada', tags: ['admin', 'author'] });
  }
}
