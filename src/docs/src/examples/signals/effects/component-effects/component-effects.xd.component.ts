import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { leaked } from './clock';

/**
 * Mounts and removes a child component, to compare its two effects.
 */
@WebComponent({
  selector: 'ex-component-effects',
  styleUrl: './component-effects.css',
  templateUrl: './component-effects.xd.component.html'
})
export class ComponentEffectsComponent extends CustomElement {
  /**
   * Whether the child is in the page.
   */
  public readonly mounted = signal(false);
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
    const disposers = leaked.splice(0);
    for (let i = 0; i < disposers.length; i++) {
      disposers[i]();
    }

    this.alive.set(0);
  }

  /**
   * Disposes the standalone effects when the example leaves the page.
   */
  public onDestroy(): void {
    this.disposeLeaked();
  }
}
