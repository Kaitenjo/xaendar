import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Binds a static value to an input inherited from a base class: the template compiler does not check it.
 */
@WebComponent({
  selector: 'ex-inherited-input',
  templateUrl: './inherited-input.xd.component.html'
})
export class InheritedInputComponent extends CustomElement {}
