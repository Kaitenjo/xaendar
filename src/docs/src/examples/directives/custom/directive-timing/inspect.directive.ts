import { CustomDirective, Directive, Event, Property } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Reports what it finds on the element when it starts, and every time its label changes.
 */
@Directive({ selector: 'exInspect' })
export class InspectDirective extends CustomDirective<HTMLElement> {
  /**
   * A bound input.
   */
  @Property('default')
  public accessor label!: InputSignal<string>;
  /**
   * Emitted with a line to log.
   */
  @Event()
  public accessor report!: Output<string>;

  /**
   * Inspects the element now and after a microtask.
   */
  public onInit(): void {
    const element = this.element;
    this.report.emit(`onInit: label="${this.label()}", id="${element.id}", connected=${element.isConnected}, children=${element.children.length}`);
    queueMicrotask(() => this.report.emit(`after a microtask: children=${element.children.length}`));
    this.effect(() => this.report.emit(`effect: label="${this.label()}"`));
  }
}
