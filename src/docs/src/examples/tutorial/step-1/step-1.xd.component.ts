import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Step 1: a component with a static template.
 */
@WebComponent({
  selector: 'ex-todo-step-1',
  templateUrl: './step-1.xd.component.html',
  styleUrl: './step-1.css'
})
export class TodoStep1Component extends CustomElement {}
