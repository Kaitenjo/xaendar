import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Logs what a query holds before the render, after it, and right after a change of the template.
 */
@WebComponent({
  selector: 'ex-query-timing',
  templateUrl: './query-timing.xd.component.html',
  styleUrl: './query-timing.css'
})
export class QueryTimingComponent extends CustomElement {
  /**
   * Every item of the list. A bare li would also match the lines of the log, which the effect adds: a loop.
   */
  @Query.all('.item')
  public accessor listItems!: QuerySignal<HTMLElement[]>;
  /**
   * The items to render.
   */
  public readonly items = signal([1, 2]);
  /**
   * What happened, step by step.
   */
  public readonly log = signal<Array<{ id: number; text: string }>>([]);
  /**
   * The identifier of the next line.
   */
  private _nextId = 0;

  /**
   * Logs the query before the render, and follows it with an effect.
   */
  public onInit(): void {
    this._write(`onInit: ${this.listItems().length} items`);
    this.effect(() => this._write(`effect: ${this.listItems().length} items`));
  }

  /**
   * Logs the query after the render.
   */
  public afterRender(): void {
    this._write(`afterRender: ${this.listItems().length} items`);
  }

  /**
   * Adds an item, then logs the query at once and after each of the next two microtasks.
   */
  public async add(): Promise<void> {
    this.items.update(items => [...items, items.length + 1]);
    this._write(`right after the change: ${this.listItems().length} items`);
    await Promise.resolve();
    this._write(`after one microtask: ${this.listItems().length} items`);
    await Promise.resolve();
    this._write(`after two microtasks: ${this.listItems().length} items`);
  }

  /**
   * Appends a line to the log.
   *
   * @param text - The line.
   */
  private _write(text: string): void {
    this.log.update(lines => [...lines, { id: this._nextId++, text }]);
  }
}
