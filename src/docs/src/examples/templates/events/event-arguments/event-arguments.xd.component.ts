import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';

/**
 * Calls methods from event bindings with every kind of argument a template accepts.
 */
@WebComponent({
  selector: 'ex-event-arguments',
  templateUrl: './event-arguments.xd.component.html',
  styleUrl: './event-arguments.css'
})
export class EventArgumentsComponent extends CustomElement {
  /**
   * Two counters, changed by the same method.
   */
  public readonly apples = signal(0);

  /**
   * The second counter.
   */
  public readonly pears = signal(0);

  /**
   * The colors to choose from.
   */
  public readonly colors = [{ id: 1, name: 'red' }, { id: 2, name: 'green' }, { id: 3, name: 'blue' }];

  /**
   * The calls received, latest first.
   */
  public readonly calls = signal<Array<{ id: number; text: string }>>([]);

  /**
   * The identifier of the next line.
   */
  private nextId = 0;

  /**
   * Receives literal arguments.
   *
   * @param name - A string.
   * @param times - A number.
   */
  public greet(name: string, times: number): void {
    this.record('greet(' + JSON.stringify(name) + ', ' + times + ')');
  }

  /**
   * Receives the event, after another argument.
   *
   * @param source - A string.
   * @param event - The click event.
   */
  public inspect(source: string, event: MouseEvent): void {
    this.record('inspect(' + JSON.stringify(source) + ', ' + event.type + ' at ' + event.clientX + ',' + event.clientY + ')');
  }

  /**
   * Receives the identifier of an item of the loop.
   *
   * @param id - The identifier.
   */
  public pick(id: number): void {
    this.record('pick(' + id + ')');
  }

  /**
   * Receives a signal, not its value: the same method can change either counter.
   *
   * @param counter - The signal to increment.
   */
  public bump(counter: Signal<number>): void {
    counter.update(value => value + 1);
    this.record('bump(signal) → ' + counter());
  }

  /**
   * Receives the input event of a field.
   *
   * @param event - The input event.
   */
  public onInput(event: Event): void {
    this.record('onInput → ' + JSON.stringify((event.target as HTMLInputElement).value));
  }

  /**
   * Adds a line to the log, keeping the last five.
   *
   * @param text - The line.
   */
  private record(text: string): void {
    this.calls.update(lines => [{ id: this.nextId++, text }, ...lines].slice(0, 5));
  }
}
