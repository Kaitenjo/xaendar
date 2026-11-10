import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { level, readPercent } from './level.store';

/**
 * Binds the same level to three meters: through a method reading the signal, a method calling a function
 * that reads it, and a computed signal.
 */
@WebComponent({
  selector: 'ex-method-in-attribute',
  styleUrl: './method-in-attribute.css',
  templateUrl: './method-in-attribute.xd.component.html'
})
export class MethodInAttributeComponent extends CustomElement {
  /**
   * The level as a percentage, computed.
   */
  public readonly percent = computed(() => this._computePercent());

  /**
   * The level as a percentage, read by the method itself.
   *
   * @returns The percentage.
   */
  public percentOf(): number {
    return level() * 10;
  }

  /**
   * The level as a percentage, read through a function of the store: the binding follows the signal all the same,
   * since it tracks what it reads while it runs.
   *
   * @returns The percentage.
   */
  public percentFromHelper(): number {
    return readPercent();
  }

  /**
   * Raises the level, then starts again.
   */
  public raise(): void {
    level.update(value => value >= 10 ? 0 : value + 1);
  }

  /**
   * Computes the value of `percent`.
   *
   * @returns The level as a percentage.
   */
  private _computePercent(): number {
    return readPercent();
  }
}
