import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Renders the same words written in six ways, to show what happens to line breaks and spaces.
 */
@WebComponent({
  selector: 'ex-whitespace',
  templateUrl: './whitespace.xd.component.html',
  styleUrl: './whitespace.css'
})
export class WhitespaceComponent extends CustomElement {
  /**
   * A first name.
   */
  public readonly first = signal('Ada');
  /**
   * A last name.
   */
  public readonly last = signal('Lovelace');
}
