import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-d', templateUrl: './d.xd.component.html' })
export class LabD extends CustomElement {
  public readonly items = signal([{ id: 1, done: false, name: 'a' }, { id: 2, done: false, name: 'b' }]);
  public toggle(): void {
    this.items.update(items => items.map(item => item.id === 1 ? { ...item, done: !item.done, name: 'A!' } : item));
  }
}
