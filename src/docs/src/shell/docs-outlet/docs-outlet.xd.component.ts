import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Renders the page being read: a `@switch` on the path picks its component. Pages are not
 * rendered again when the language changes: their texts follow it on their own.
 */
@WebComponent({
  selector: 'docs-outlet',
  templateUrl: './docs-outlet.xd.component.html'
})
export class DocsOutletComponent extends CustomElement {}
