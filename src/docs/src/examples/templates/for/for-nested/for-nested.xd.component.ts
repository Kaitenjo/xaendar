import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A multiplication table built by two nested loops.
 */
@WebComponent({
  selector: 'ex-for-nested',
  templateUrl: './for-nested.xd.component.html',
  styleUrl: './for-nested.css'
})
export class ForNestedComponent extends CustomElement {
  /**
   * The factors.
   */
  public readonly factors = [1, 2, 3, 4];
}
