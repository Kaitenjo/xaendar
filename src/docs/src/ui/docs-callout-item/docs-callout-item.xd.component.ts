import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * One entry of a {@link DocsCalloutComponent} that groups several: its title and its content,
 * projected in its default slot. The entries after the first are separated from the previous one.
 *
 * @example
 * <docs-callout kind="edge">
 *   <docs-callout-item heading="A title">
 *     <p>The first edge case.</p>
 *   </docs-callout-item>
 *   <docs-callout-item heading="Another title">
 *     <p>The second one.</p>
 *   </docs-callout-item>
 * </docs-callout>
 */
@WebComponent({
  selector: 'docs-callout-item',
  styleUrl: './docs-callout-item.xd.component.css',
  templateUrl: './docs-callout-item.xd.component.html'
})
export class DocsCalloutItemComponent extends CustomElement {
  /**
   * The title of the entry.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
}
