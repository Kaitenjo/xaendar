import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Shows a tooltip above the element while the pointer is over it or while it has the focus.
 * The tooltip is appended to the body, so no ancestor can clip it.
 */
@Directive({ selector: 'exTooltip' })
export class TooltipDirective extends CustomDirective<HTMLElement> {
  /**
   * The text of the tooltip.
   */
  @Property('')
  public accessor text!: InputSignal<string>;
  /**
   * The tooltip, created once and attached while it is shown.
   */
  private readonly _tip = document.createElement('div');
  /**
   * Shows the tooltip, above the element.
   */
  private readonly _show = (): void => {
    const box = this.element.getBoundingClientRect();
    this._tip.style.left = `${box.left + box.width / 2}px`;
    this._tip.style.top = `${box.top - 8}px`;
    document.body.append(this._tip);
  };
  /**
   * Hides the tooltip.
   */
  private readonly _hide = (): void => {
    this._tip.remove();
  };

  /**
   * Styles the tooltip, keeps its text in sync and starts listening to the element.
   */
  public onInit(): void {
    Object.assign(this._tip.style, {
      position: 'fixed',
      transform: 'translate(-50%, -100%)',
      padding: '0.3rem 0.55rem',
      borderRadius: '6px',
      background: '#191b26',
      color: '#ffffff',
      font: '0.8rem system-ui, sans-serif',
      pointerEvents: 'none',
      zIndex: '1000'
    });
    this._tip.setAttribute('role', 'tooltip');
    this.effect(() => {
      this._tip.textContent = this.text();
    });

    this.element.addEventListener('pointerenter', this._show);
    this.element.addEventListener('pointerleave', this._hide);
    this.element.addEventListener('focus', this._show);
    this.element.addEventListener('blur', this._hide);
  }

  /**
   * Stops listening and removes the tooltip: it lives outside the element, so it would outlive it.
   */
  public onDestroy(): void {
    this.element.removeEventListener('pointerenter', this._show);
    this.element.removeEventListener('pointerleave', this._hide);
    this.element.removeEventListener('focus', this._show);
    this.element.removeEventListener('blur', this._hide);
    this._hide();
  }
}
