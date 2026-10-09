import { CustomElement, WebComponent } from '@xaendar/core';
import { path } from '../../core/router/router';

/**
 * Renders the page being read, in the current language.
 *
 * Every page exists in two components, one per language: a `@switch` on the path picks the page,
 * and the `*lang` structural directive keeps only the component in the current language.
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
