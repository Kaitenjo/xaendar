import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';
import { leaked, log } from './clock';

/**
 * Mounts and removes a child component, to compare its two effects.
 */
@WebComponent({
  selector: 'ex-component-effects',
  templateUrl: './component-effects.xd.component.html',
  styleUrl: './component-effects.css'
})
export class ComponentEffectsComponent extends CustomElement {
  /**
   * Whether the child is in the page.
   */
  public readonly mounted = signal(false);

  /**
   * What the effects logged. Typed, so that the template compiler knows it is a signal.
   */
  public readonly log: Signal<Array<{ id: number; text: string }>> = log;

  /**
   * How many standalone effects are still alive.
   */
  public readonly alive = signal(0);

  /**
   * Adds or removes the child.
   */
  public toggle(): void {
    this.mounted.update(mounted => !mounted);
    queueMicrotask(() => this.alive.set(leaked.length));
  }

  /**
   * Disposes every standalone effect created so far.
   */
  public disposeLeaked(): void {
    leaked.splice(0).forEach(dispose => dispose());
    this.alive.set(0);
  }

  /**
   * Disposes the standalone effects when the example leaves the page.
   */
  public onDestroy(): void {
    this.disposeLeaked();
  }
}
