import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-ro', templateUrl: './err.xd.component.html' })
export class LabRo extends CustomElement {
  @Property(0)
  public accessor count!: InputSignal<number>;
  public reset(): void {
    this.count.set(0);
    const n: number = this.count.get();
    void n;
  }
}
const x: InputSignal<number> = null!;
x.set(1);
