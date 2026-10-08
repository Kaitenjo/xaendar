import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Shows a list of tags, normalized on the way in.
 */
@WebComponent({
  selector: 'ex-tag-list',
  templateUrl: './tag-list.xd.component.html',
  styleUrl: './tag-list.css'
})
export class TagListComponent extends CustomElement {
  /**
   * The tags. Every incoming list is trimmed, lowercased and cleared of empty tags, then compared with the current
   * one: an equal list does not notify the readers of the input.
   */
  @Property(new Array<string>, {
    transform: (tags: string[]) => tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag !== ''),
    equals: (a: string[], b: string[]) => a.join() === b.join()
  })
  public accessor tags!: InputSignal<string[]>;

  /**
   * How many times the readers of the input were notified.
   */
  public readonly notifications = signal(0);

  /**
   * Counts the notifications. The first run reads the default value, before the parent binds the input.
   */
  public onInit(): void {
    this.effect(() => {
      this.tags();
      this.notifications.update(count => count + 1);
    });
  }
}
