import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Draws a bar chart on a canvas, again whenever the values or the color change.
 */
@WebComponent({
  selector: 'ex-canvas-chart',
  templateUrl: './canvas-chart.xd.component.html',
  styleUrl: './canvas-chart.css'
})
export class CanvasChartComponent extends CustomElement {
  /**
   * The canvas of the template.
   */
  @Query<HTMLCanvasElement>('canvas')
  public accessor canvas!: QuerySignal<HTMLCanvasElement | null>;
  /**
   * The values of the bars, from 0 to 100.
   */
  public readonly values = signal([40, 75, 30, 90, 55]);
  /**
   * The color of the bars.
   */
  public readonly color = signal('#6750a4');
  /**
   * How many times the chart was drawn.
   */
  public readonly draws = signal(0);

  /**
   * Starts drawing: the canvas exists only once the template is rendered. The effect is disposed at the
   * disconnection, and created again at the next connection with the new canvas.
   */
  public afterRender(): void {
    this.effect(() => {
      const canvas = this.canvas();
      const context = canvas?.getContext('2d');
      if (!canvas || !context) {
        return;
      }

      const values = this.values();
      const width = canvas.width / values.length;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = this.color();
      values.forEach((value, index) => {
        const height = canvas.height * value / 100;
        context.fillRect(index * width + 4, canvas.height - height, width - 8, height);
      });
      this.draws.update(draws => draws + 1);
    });
  }

  /**
   * Gives the bars new random values.
   */
  public shuffle(): void {
    this.values.update(values => values.map(() => Math.round(10 + Math.random() * 90)));
  }

  /**
   * Switches the color of the bars.
   */
  public recolor(): void {
    this.color.update(color => color === '#6750a4' ? '#00796b' : '#6750a4');
  }
}
