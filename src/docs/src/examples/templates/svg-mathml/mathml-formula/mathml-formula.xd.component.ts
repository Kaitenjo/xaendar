import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * The solutions of a quadratic equation, written in MathML with the coefficients bound to signals.
 */
@WebComponent({
  selector: 'ex-mathml-formula',
  templateUrl: './mathml-formula.xd.component.html',
  styleUrl: './mathml-formula.css'
})
export class MathmlFormulaComponent extends CustomElement {
  /**
   * The coefficient of x².
   */
  public readonly a = signal(1);

  /**
   * The coefficient of x.
   */
  public readonly b = signal(-3);

  /**
   * The constant term.
   */
  public readonly c = signal(2);

  /**
   * The discriminant.
   */
  public readonly delta = computed(() => this.b() * this.b() - 4 * this.a() * this.c());

  /**
   * The real solutions, or a note when there are none.
   */
  public readonly solutions = computed(() => {
    const delta = this.delta();
    if (delta < 0) {
      return 'no real solutions';
    }
    const root = Math.sqrt(delta);
    const first = (-this.b() + root) / (2 * this.a());
    const second = (-this.b() - root) / (2 * this.a());
    return 'x = ' + first.toFixed(2) + ', x = ' + second.toFixed(2);
  });

  /**
   * Reads the slider of b.
   *
   * @param event - The input event of the slider.
   */
  public setB(event: Event): void {
    this.b.set(Number((event.target as HTMLInputElement).value));
  }
}
