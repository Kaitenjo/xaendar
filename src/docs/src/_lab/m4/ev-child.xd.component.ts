import { CustomElement, Event, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';

@WebComponent({ selector: 'lab-ev-child', templateUrl: './ev-child.xd.component.html' })
export class LabEvChild extends CustomElement {
  @Event()
  public accessor valueChange!: Output<number>;
  @Event()
  public accessor ping!: Output;
  @Event({ bubbles: true })
  public accessor bubbly!: Output<string>;
  @Event({ bubbles: true, composed: true })
  public accessor composedEv!: Output<string>;
  @Event()
  public accessor payload!: Output<{ bubbles: boolean; value: number }>;

  public fire(): void {
    this.valueChange.emit(7);
    this.ping.emit();
    this.bubbly.emit('b');
    this.composedEv.emit('c');
    this.payload.emit({ bubbles: true, value: 1 });
    this.bubbly.emit('override', { bubbles: false });
  }
}
