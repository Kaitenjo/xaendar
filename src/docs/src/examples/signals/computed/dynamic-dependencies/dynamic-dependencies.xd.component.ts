import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Dependencies are collected at each evaluation: a signal read in a branch not taken is not a dependency.
 */
@WebComponent({
  selector: 'ex-computed-dynamic',
  templateUrl: './dynamic-dependencies.xd.component.html',
  styleUrl: './dynamic-dependencies.css'
})
export class ComputedDynamicComponent extends CustomElement {
  /**
   * Whether the title is part of the label.
   */
  public readonly showTitle = signal(false);

  /**
   * The title.
   */
  public readonly title = signal('Dr.');

  /**
   * The name.
   */
  public readonly name = signal('Grace Hopper');

  /**
   * Evaluations of `label`, counted as a signal so the template shows them.
   */
  public readonly evaluations = signal(0);

  /**
   * Reads `title` only while `showTitle` is true.
   */
  public readonly label = computed(() => {
    queueMicrotask(() => this.evaluations.update(count => count + 1));
    return this.showTitle() ? `${this.title()} ${this.name()}` : this.name();
  });

  /**
   * Toggles the title.
   */
  public toggleTitle(): void {
    this.showTitle.update(show => !show);
  }

  /**
   * Changes the title: label is evaluated again only while it reads it.
   */
  public changeTitle(): void {
    this.title.update(title => title === 'Dr.' ? 'Rear Admiral' : 'Dr.');
  }
}
