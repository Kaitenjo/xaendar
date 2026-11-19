import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The steps of the wizard.
 */
type Step = 'account' | 'profile' | 'done';

/**
 * A wizard whose steps slide in and out with the Web Animations API, the step leaving taken out of the flow while it
 * leaves.
 */
@WebComponent({
  selector: 'ex-animated-panel',
  styleUrl: './animated-panel.css',
  templateUrl: './animated-panel.xd.component.html'
})
export class AnimatedPanelComponent extends CustomElement {
  /**
   * The step shown.
   */
  public readonly step = signal<Step>('account');
  /**
   * The steps, in order.
   */
  private readonly _steps: readonly Step[] = ['account', 'profile', 'done'];

  /**
   * Slides a step in from the right.
   *
   * @param element - The step.
   * @returns The end of the animation.
   */
  public slideIn(element: HTMLElement): Promise<Animation> {
    return element.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: 'ease-out' }).finished;
  }

  /**
   * Slides a step out to the left.
   *
   * @param element - The step.
   * @returns The end of the animation.
   */
  public slideOut(element: HTMLElement): Promise<Animation> {
    return element.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-40px)' }], { duration: 250, easing: 'ease-in', fill: 'forwards' }).finished;
  }

  /**
   * Shows the next step, the first one after the last.
   */
  public next(): void {
    this.step.update(step => this._steps[(this._steps.indexOf(step) + 1) % this._steps.length]);
  }
}
