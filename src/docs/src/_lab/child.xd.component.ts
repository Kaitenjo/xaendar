import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-child', templateUrl: './child.xd.component.html' })
export class LabChild extends CustomElement {
  @Property('')
  public accessor code!: InputSignal<string>;
  public readonly upper = computed(() => this.code().toUpperCase());
}
