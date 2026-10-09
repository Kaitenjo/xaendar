import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { trace } from './trace.directive';

/**
 * A directive applied by a condition, and a directive whose input is bound by a condition.
 */
@WebComponent({
  selector: 'ex-traced-demo',
  templateUrl: './traced-demo.xd.component.html',
  styleUrl: './traced-demo.css'
})
export class TracedDemoComponent extends CustomElement {
  /**
   * Whether the first paragraph has the directive.
   */
  public readonly applied = signal(true);
  /**
   * Whether the second paragraph is warm.
   */
  public readonly warm = signal(true);
  /**
   * The trace of the directives.
   */
  public readonly trace = trace;

  /**
   * Applies or removes the directive.
   */
  public toggleApplied(): void {
    this.applied.update(applied => !applied);
  }

  /**
   * Switches the color of the second paragraph.
   */
  public toggleWarm(): void {
    this.warm.update(warm => !warm);
  }
}
