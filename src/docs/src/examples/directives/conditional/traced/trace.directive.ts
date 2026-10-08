import { CustomDirective, Directive, Property } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

import type { InputSignal } from '@xaendar/core/signals';

/**
 * A line of the trace.
 */
export type TraceLine = { id: number; text: string };

/**
 * The trace written by every instance of the directive.
 */
export const trace = signal(new Array<TraceLine>());

/**
 * The id of the next line, and of the next instance.
 */
let nextLine = 0;
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
   * The number of this instance.
   */
  private readonly instance = nextInstance++;

  /**
   * A label, shown as the background color of the element.
   */
  @Property('none')
  public accessor color!: InputSignal<string>;

  /**
   * Starts tracing.
   */
  public onInit(): void {
    write(`#${this.instance} onInit`);
    this.effect(() => {
      write(`#${this.instance} color=${this.color()}`);
      this.element.style.backgroundColor = this.color() === 'none' ? '' : this.color();
    });
  }

  /**
   * Clears the background, since the element outlives the directive.
   */
  public onDestroy(): void {
    write(`#${this.instance} onDestroy`);
    this.element.style.backgroundColor = '';
  }
}
