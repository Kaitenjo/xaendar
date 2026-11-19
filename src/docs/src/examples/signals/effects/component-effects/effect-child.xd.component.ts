import { CustomElement, WebComponent } from '@xaendar/core';
import { effect } from '@xaendar/core/signals';
import { leaked, seconds, write } from './clock';

/**
 * Creates two effects: one bound to the component, one standalone.
 */
@WebComponent({
  selector: 'ex-effect-child',
  templateUrl: './effect-child.xd.component.html'
})
export class EffectChildComponent extends CustomElement {
  /**
   * Creates the effects.
   */
  public onInit(): void {
    // Disposed automatically when the component is removed
    this.effect(() => write(`this.effect() saw ${seconds()} s`));
    // Lives until its disposer is called, whatever happens to the component
    leaked.push(effect(() => write(`standalone effect() saw ${seconds()} s`)));
  }
}
