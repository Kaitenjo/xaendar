import { CustomElement, WebComponent } from '@xaendar/core';
import { effect, signal } from '@xaendar/core/signals';

/**
 * Disposing an effect twice: the standalone disposer throws, the one of this.effect() does not.
 */
@WebComponent({
  selector: 'ex-effect-dispose',
  templateUrl: './dispose.xd.component.html',
  styleUrl: './dispose.css'
})
export class EffectDisposeComponent extends CustomElement {
  /**
   * The dependency of the effects.
   */
  public readonly count = signal(0);
  /**
   * What happened with the standalone effect.
   */
  public readonly standaloneOutcome = signal('');
  /**
   * What happened with the effect bound to the component.
   */
  public readonly boundOutcome = signal('');

  /**
   * Disposes a standalone effect twice.
   */
  public disposeStandaloneTwice(): void {
    const stop = effect(() => this.count());
    stop();
    try {
      stop();
      this.standaloneOutcome.set('No error');
    } catch (error) {
      this.standaloneOutcome.set(`The second call threw: ${(error as Error).message}`);
    }
  }

  /**
   * Disposes an effect bound to the component twice.
   */
  public disposeBoundTwice(): void {
    const stop = this.effect(() => this.count());
    stop();
    stop();
    this.boundOutcome.set('No error: the disposer of this.effect() does nothing the second time');
  }
}
