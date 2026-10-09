import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Counts how many times the expression of a @switch runs.
 */
@WebComponent({
  selector: 'ex-switch-evaluations',
  templateUrl: './switch-evaluations.xd.component.html',
  styleUrl: './switch-evaluations.css'
})
export class SwitchEvaluationsComponent extends CustomElement {
  /**
   * The day of the week, from 1 to 7.
   */
  public readonly day = signal(1);
  /**
   * How many times dayName ran.
   */
  public readonly evaluations = signal(0);

  /**
   * The name of the day, counting its own runs.
   *
   * @returns The name of the day.
   */
  public dayName(): string {
    this.evaluations.update(count => count + 1);
    return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][this.day() - 1] ?? 'mon';
  }

  /**
   * Moves to the next day.
   */
  public next(): void {
    this.day.update(day => day === 7 ? 1 : day + 1);
  }

  /**
   * Resets the count.
   */
  public resetCount(): void {
    this.evaluations.set(0);
  }
}
