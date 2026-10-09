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
  public readonly quadratic = signal(1);
  /**
   * The coefficient of x.
   */
  public readonly linear = signal(-3);
  /**
   * The constant term.
   */
  public readonly constant = signal(2);
  /**
   * The discriminant.
   */
  public readonly delta = computed(() => this._computeDelta());
  /**
   * The real solutions, or a note when there are none.
   */
  public readonly solutions = computed(() => this._computeSolutions());

  /**
   * Reads the slider of the coefficient of x.
   *
   * @param event - The input event of the slider.
   */
  public setLinear(event: Event): void {
    this.linear.set(Number((event.target as HTMLInputElement).value));
  }

  /**
   * Computes the value of `delta`.
   *
   * @returns The discriminant.
   */
  private _computeDelta(): number {
    return this.linear() * this.linear() - 4 * this.quadratic() * this.constant();
  }

  /**
   * Computes the value of `solutions`.
   *
   * @returns The real solutions, or a note when there are none.
   */
  private _computeSolutions(): string {
    const delta = this.delta();
    if (delta < 0) {
      return 'no real solutions';
    }
    const root = Math.sqrt(delta);
    const first = (-this.linear() + root) / (2 * this.quadratic());
    const second = (-this.linear() - root) / (2 * this.quadratic());
    return `x = ${first.toFixed(2)}, x = ${second.toFixed(2)}`;
  }
}
