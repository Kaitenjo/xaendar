import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-orphan-lazy', templateUrl: './orphan-lazy.xd.component.html', styleUrl: './shared.css' })
export class LabOrphanLazy extends CustomElement {
  @Property(0)
  public accessor count!: InputSignal<number>;
  @Property('default')
  public accessor label!: InputSignal<string>;
}
