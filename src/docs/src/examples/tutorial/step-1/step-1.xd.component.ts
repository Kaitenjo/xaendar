import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Step 1: a component with a static template.
 */
@WebComponent({
  selector: 'ex-todo-step-1',
  styleUrl: './step-1.css',
  templateUrl: './step-1.xd.component.html'
})
export class TodoStep1Component extends CustomElement {}
