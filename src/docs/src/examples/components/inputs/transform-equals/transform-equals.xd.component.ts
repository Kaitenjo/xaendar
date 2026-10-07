import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Sends raw lists of tags to a component that normalizes them, and ignores the lists equal to the current one.
 */
@WebComponent({
  selector: 'ex-transform-equals',
  templateUrl: './transform-equals.xd.component.html',
  styleUrl: './transform-equals.css'
})
export class TransformEqualsComponent extends CustomElement {
  /**
   * The tags, as typed by a user.
   */
  public readonly raw = signal(['  Signals', 'COMPONENTS ', '']);

  /**
   * The raw tags, as code.
   */
  public readonly rawText = computed(() => JSON.stringify(this.raw()));

  /**
   * Sends a new array that normalizes to the current tags.
   */
  public sendSame(): void {
    this.raw.set(['signals', ' Components']);
  }

  /**
   * Sends different tags.
   */
  public sendOther(): void {
    this.raw.set([' Templates', 'directives  ', 'SIGNALS']);
  }
}
