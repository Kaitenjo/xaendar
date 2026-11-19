import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A multiplication table built by two nested loops.
 */
@WebComponent({
  selector: 'ex-for-nested',
  styleUrl: './for-nested.css',
  templateUrl: './for-nested.xd.component.html'
})
export class ForNestedComponent extends CustomElement {
  /**
   * The factors.
   */
  public readonly factors = [1, 2, 3, 4];
}
