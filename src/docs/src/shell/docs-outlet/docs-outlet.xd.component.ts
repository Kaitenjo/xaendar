import { CustomElement, WebComponent } from '@xaendar/core';
import { path } from '../../core/router/router';

/**
 * Renders the page being read: a `@switch` on the path picks its component. Pages are not
 * rendered again when the language changes: their texts follow it on their own.
 */
@WebComponent({
  selector: 'docs-outlet',
  templateUrl: './docs-outlet.xd.component.html'
})
export class DocsOutletComponent extends CustomElement {
  /**
   * The path of the page being read.
   */
  public readonly path = path;
}
