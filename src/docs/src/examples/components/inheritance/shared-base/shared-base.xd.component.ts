import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Two components with different templates and the same logic, inherited from a base class.
 */
@WebComponent({
  selector: 'ex-shared-base',
  templateUrl: './shared-base.xd.component.html',
  styleUrl: './shared-base.css'
})
export class SharedBaseComponent extends CustomElement {}
