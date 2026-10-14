import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * HTML inside a foreignObject: the elements are created in the HTML namespace.
 */
@WebComponent({
  selector: 'ex-foreign-object',
  styleUrl: './foreign-object.css',
  templateUrl: './foreign-object.xd.component.html'
})
export class ForeignObjectComponent extends CustomElement {
  /**
   * The paragraph inside the foreignObject.
   */
  @Query('foreignObject p')
  public accessor paragraph!: QuerySignal<HTMLElement | null>;
  /**
   * The namespace the paragraph was created in.
   */
  public readonly namespace = computed(() => this._computeNamespace());

  /**
   * Computes the value of `namespace`.
   *
   * @returns The namespace the paragraph was created in.
   */
  private _computeNamespace(): string {
    return this.paragraph()?.namespaceURI ?? 'not found yet';
  }
}
