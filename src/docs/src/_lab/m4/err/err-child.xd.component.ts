import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { Todo } from './todo.type';

@WebComponent({ selector: 'lab-err-child', templateUrl: './err-child.xd.component.html' })
export class LabErrChild extends CustomElement {
  @Property.required()
  public accessor todo!: InputSignal<Todo>;
}
