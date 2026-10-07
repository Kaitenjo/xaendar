import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-err', templateUrl: './err.xd.component.html' })
export class LabErr extends CustomElement {
  public readonly item = signal({ title: 'a', done: false });
}
