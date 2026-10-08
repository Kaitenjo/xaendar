import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Grows an SVG circle while the pointer is over it. The element is typed as SVGCircleElement,
 * so its animated radius is available.
 */
@Directive({ selector: 'exGrow' })
export class GrowDirective extends CustomDirective<SVGCircleElement> {
  /**
   * How much the radius grows.
   */
  @Property(1.5)
  public accessor scale!: InputSignal<number>;

  /**
   * The radius the circle was rendered with.
   */
  private radius = 0;

  /**
   * Grows the circle.
   */
  private readonly grow = (): void => {
    this.element.r.baseVal.value = this.radius * this.scale();
  };

  /**
   * Brings the circle back to its size.
   */
  private readonly shrink = (): void => {
    this.element.r.baseVal.value = this.radius;
  };

  /**
   * Reads the radius and starts listening.
   */
  public onInit(): void {
    this.radius = this.element.r.baseVal.value;
    this.element.addEventListener('pointerenter', this.grow);
    this.element.addEventListener('pointerleave', this.shrink);
  }

  /**
   * Stops listening.
   */
  public onDestroy(): void {
    this.element.removeEventListener('pointerenter', this.grow);
    this.element.removeEventListener('pointerleave', this.shrink);
  }
}
