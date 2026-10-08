import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Wraps a counter and forwards its own content to it, with a fallback item of its own.
 */
@WebComponent({
  selector: 'ex-list-wrapper',
  templateUrl: './list-wrapper.xd.component.html'
})
export class ListWrapperComponent extends CustomElement {}
