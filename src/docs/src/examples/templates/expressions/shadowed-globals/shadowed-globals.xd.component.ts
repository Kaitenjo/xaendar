import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Members named like globals of the browser: two of them are hidden by the global.
 */
@WebComponent({
  selector: 'ex-shadowed-globals',
  templateUrl: './shadowed-globals.xd.component.html',
  styleUrl: './shadowed-globals.css'
})
export class ShadowedGlobalsComponent extends CustomElement {
  /**
   * The history of an order.
   */
  public readonly history = 'created → paid → shipped';

  /**
   * Where the order is.
   */
  public readonly location = 'Milan warehouse';

  /**
   * The name of the order.
   */
  public readonly name = 'Order 42';

  /**
   * The state of the order.
   */
  public readonly status = 'on its way';
}
