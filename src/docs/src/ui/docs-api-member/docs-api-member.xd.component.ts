import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A member of a symbol of the API reference: its name and its signature, then its description and its examples,
 * projected in the default slot.
 *
 * @example
 * <docs-api-member name="selector" signature="selector: string">
 *   <p>The custom element name.</p>
 * </docs-api-member>
 */
@WebComponent({
  selector: 'docs-api-member',
  styleUrl: './docs-api-member.xd.component.css',
  templateUrl: './docs-api-member.xd.component.html'
})
export class DocsApiMemberComponent extends CustomElement {
  /**
   * The name of the member.
   */
  @Property.required()
  public accessor name!: InputSignal<string>;
  /**
   * How the member is declared or called.
   */
  @Property('')
  public accessor signature!: InputSignal<string>;
}
