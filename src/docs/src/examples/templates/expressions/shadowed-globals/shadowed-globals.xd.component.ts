import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Members named like globals of the browser: each one hides the global in the template.
 */
@WebComponent({
  selector: 'ex-shadowed-globals',
  styleUrl: './shadowed-globals.css',
  templateUrl: './shadowed-globals.xd.component.html'
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
