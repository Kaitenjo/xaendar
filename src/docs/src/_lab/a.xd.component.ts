import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-a', templateUrl: './a.xd.component.html' })
export class LabA extends CustomElement {
  public readonly open = signal(true);
  public readonly x = signal('a');
}
