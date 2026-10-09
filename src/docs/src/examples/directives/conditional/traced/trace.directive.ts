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
 * Writes a line in the trace.
 *
 * @param text - The line.
 */
function write(text: string): void {
  const line = { id: nextLine++, text };
  trace.update(lines => [...lines, line]);
}

/**
 * Traces its own lifecycle, and the values of its input.
 */
@Directive({ selector: 'exTraced' })
export class TracedDirective extends CustomDirective<HTMLElement> {
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
    write(`#${this._instance} onInit`);
    this.effect(() => {
      write(`#${this._instance} color=${this.color()}`);
      this.element.style.backgroundColor = this.color() === 'none' ? '' : this.color();
    });
  }

  /**
   * Clears the background, since the element outlives the directive.
   */
  public onDestroy(): void {
    write(`#${this._instance} onDestroy`);
    this.element.style.backgroundColor = '';
  }
}
