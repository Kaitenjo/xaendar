import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Interpolates values of every kind, to show the text each one becomes.
 */
@WebComponent({
  selector: 'ex-value-rendering',
  templateUrl: './value-rendering.xd.component.html',
  styleUrl: './value-rendering.css'
})
export class ValueRenderingComponent extends CustomElement {
  /**
   * Null.
   */
  public readonly nothing = null;
  /**
   * Undefined.
   */
  public readonly missing = undefined;
  /**
   * False.
   */
  public readonly no = false;
  /**
   * Zero.
   */
  public readonly zero = 0;
  /**
   * An array.
   */
  public readonly list = ['a', 'b'];
  /**
   * An object.
   */
  public readonly point = { x: 1, y: 2 };
  /**
   * A signal, interpolated with and without the call.
   */
  public readonly count = signal(3);
}
