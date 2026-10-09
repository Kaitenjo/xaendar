import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * The same chain written twice: with an element in every branch of an @if, and as a @switch on a computed signal.
 */
@WebComponent({
  selector: 'ex-branch-collision',
  templateUrl: './branch-collision.xd.component.html',
  styleUrl: './branch-collision.css'
})
export class BranchCollisionComponent extends CustomElement {
  /**
   * The temperature, in degrees.
   */
  public readonly degrees = signal(5);
  /**
   * The range the temperature falls in.
   */
  public readonly level = computed(() => this._computeLevel());

  /**
   * Reads the slider.
   *
   * @param event - The input event of the slider.
   */
  public setDegrees(event: Event): void {
    this.degrees.set(Number((event.target as HTMLInputElement).value));
  }

  /**
   * Computes the value of `level`.
   *
   * @returns The range the temperature falls in.
   */
  private _computeLevel(): string {
    const degrees = this.degrees();
    return degrees < 0 ? 'freezing' : degrees < 15 ? 'cold' : degrees < 25 ? 'mild' : 'hot';
  }
}
