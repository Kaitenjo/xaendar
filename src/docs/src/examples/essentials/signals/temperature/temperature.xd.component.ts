import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A writable signal, a computed signal derived from it and an effect reacting to it.
 */
@WebComponent({
  selector: 'ex-temperature',
  templateUrl: './temperature.xd.component.html',
  styleUrl: './temperature.css'
})
export class TemperatureComponent extends CustomElement {
  /**
   * A writable signal: the source of truth.
   */
  public readonly celsius = signal(20);

  /**
   * A computed signal: derived, read-only, recomputed only when `celsius` changes.
   */
  public readonly fahrenheit = computed(() => Math.round(this.celsius() * 9 / 5 + 32));

  /**
   * What the effect logged, most recent first. Each line has a unique id to be tracked by.
   */
  public readonly log = signal<Array<{ id: number; text: string }>>([]);

  /**
   * The id of the next logged line.
   */
  private nextId = 0;

  /**
   * Creates an effect bound to the component: it runs once now, then whenever `celsius` changes,
   * and it is disposed when the component leaves the page.
   */
  public onInit(): void {
    this.effect(() => {
      const celsius = this.celsius();
      // update() reads the previous value without tracking it: the effect depends on celsius only
      this.log.update(log => [{ id: this.nextId++, text: `The effect saw ${celsius} °C` }, ...log].slice(0, 4));
    });
  }

  /**
   * Lowers the temperature by one degree.
   */
  public colder(): void {
    this.celsius.update(celsius => celsius - 1);
  }

  /**
   * Raises the temperature by one degree.
   */
  public warmer(): void {
    this.celsius.update(celsius => celsius + 1);
  }
}
