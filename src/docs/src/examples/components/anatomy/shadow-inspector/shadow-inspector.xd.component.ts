import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { RatingComponent } from '../rating/rating.xd.component';

/**
 * Inspects what the base class and the decorator set up: the shadow root, the stylesheet, the registration,
 * and when the template is rendered.
 */
@WebComponent({
  selector: 'ex-shadow-inspector',
  templateUrl: './shadow-inspector.xd.component.html',
  styleUrl: './shadow-inspector.css'
})
export class ShadowInspectorComponent extends CustomElement {
  /**
   * The expressions evaluated, with their results.
   */
  public readonly facts = signal<Array<{ id: number; expression: string; result: string }>>([]);

  /**
   * Evaluates the expressions, creating and connecting an `ex-rating` along the way.
   */
  public inspect(): void {
    const results: Array<[string, unknown]> = [
      ['this.shadowRoot.mode', this.shadowRoot!.mode],
      ['this.childNodes.length', this.childNodes.length],
      ['this.shadowRoot.children.length', this.shadowRoot!.children.length],
      ['this.shadowRoot.adoptedStyleSheets.length', this.shadowRoot!.adoptedStyleSheets.length],
      ["customElements.get('ex-rating') === RatingComponent", customElements.get('ex-rating') === RatingComponent]
    ];

    const rating = document.createElement('ex-rating');
    results.push(["document.createElement('ex-rating') instanceof RatingComponent", rating instanceof RatingComponent]);
    results.push(['rating.shadowRoot.childNodes.length, not connected', rating.shadowRoot!.childNodes.length]);
    this.shadowRoot!.append(rating);
    results.push(["rating.shadowRoot.querySelectorAll('button').length, connected", rating.shadowRoot!.querySelectorAll('button').length]);
    rating.remove();
    results.push(['rating.shadowRoot.childNodes.length, removed', rating.shadowRoot!.childNodes.length]);

    this.facts.set(results.map(([expression, result], id) => ({ id, expression, result: String(result) })));
  }
}
