import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A bar chart drawn with SVG elements, rendered by a loop and highlighted on hover.
 */
@WebComponent({
  selector: 'ex-svg-chart',
  templateUrl: './svg-chart.xd.component.html',
  styleUrl: './svg-chart.css'
})
export class SvgChartComponent extends CustomElement {
  /**
   * The visits of each day.
   */
  public readonly visits = signal([{ day: 'Mon', value: 40 }, { day: 'Tue', value: 75 }, { day: 'Wed', value: 55 }, { day: 'Thu', value: 90 }, { day: 'Fri', value: 30 }]);
  /**
   * The day under the pointer.
   */
  public readonly hovered = signal('');
  /**
   * The bars, with their geometry: the chart is 300 wide and 120 high.
   */
  public readonly bars = computed(() => this._computeBars());

  /**
   * Shows the value of a day.
   *
   * @param day - The day.
   */
  public highlight(day: string): void {
    this.hovered.set(day);
  }

  /**
   * Clears the highlight.
   */
  public clear(): void {
    this.hovered.set('');
  }

  /**
   * Gives the days new random values.
   */
  public shuffle(): void {
    this.visits.update(visits => visits.map(visit => ({ ...visit, value: Math.round(10 + Math.random() * 90) })));
  }

  /**
   * Computes the value of `bars`.
   *
   * @returns The bars, with their geometry: the chart is 300 wide and 120 high.
   */
  private _computeBars(): Array<{ day: string; value: number; x: number; y: number; height: number }> {
    return this.visits().map((visit, index) => ({
      ...visit,
      x: index * 60 + 10,
      y: 110 - visit.value,
      height: visit.value
    }));
  }
}
