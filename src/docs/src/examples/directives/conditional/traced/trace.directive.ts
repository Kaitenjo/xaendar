import { CustomDirective, Directive, Property } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

import type { InputSignal } from '@xaendar/core/signals';

/**
 * A line of the trace.
 */
export type TraceLine = {
  /**
   * The identifier of the line, used as the key of the list.
   */
  readonly id: number;
  /**
   * What the line says.
   */
  readonly text: string;
};

/**
 * The trace written by every instance of the directive.
 */
export const trace = signal(new Array<TraceLine>());

/**
 * The id of the next line.
 */
let nextLine = 0;

/**
 * The number of the next instance of the directive.
 */
let nextInstance = 1;

/**
 * Traces its own lifecycle, and the values of its input.
 */
@Directive({ selector: 'exTraced' })
export class TracedDirective extends CustomDirective<HTMLElement> {
  /**
   * A label, shown as the background color of the element.
   */
  @Property('none')
  public accessor backgroundColor!: InputSignal<string>;
  /**
   * A label, shown as the background color of the element.
   */
  @Property('none')
  public accessor color!: InputSignal<string>;
  /**
   * The number of this instance.
   */
  private readonly _instance = nextInstance++;

  /**
   * Starts tracing.
   */
  public onInit(): void {
    this._write(`#${this._instance} onInit`);
    this.effect(() => {
      const color = this.color();
      this._write(`#${this._instance} color=${color}`);
      this.element.style.backgroundColor = color === 'none' ? '' : color;
    });
    this.effect(() => {
      const backgroundColor = this.backgroundColor();
      this._write(`#${this._instance} backgroundColor=${backgroundColor}`);
      this.element.style.backgroundColor = backgroundColor === 'none' ? '' : backgroundColor;
    });
  }

  /**
   * Writes a line in the trace.
   *
   * @param text - The line.
   */
  private _write(text: string): void {
    const line = { id: nextLine++, text };
    trace.update(lines => [...lines, line]);
  }

  /**
   * Clears the background, since the element outlives the directive.
   */
  public onDestroy(): void {
    this._write(`#${this._instance} onDestroy`);
    this.element.style.backgroundColor = '';
  }
}
