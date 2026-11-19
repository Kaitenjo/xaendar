import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { ElementStyles } from '@xaendar/directives';

/**
 * A card whose style properties come from an object computed from the controls, with `@@style`.
 */
@WebComponent({
  selector: 'ex-card-designer',
  styleUrl: './card-designer.css',
  templateUrl: './card-designer.xd.component.html'
})
export class CardDesignerComponent extends CustomElement {
  /**
   * The width of the card, in percent of the preview.
   */
  public readonly width = signal(80);
  /**
   * The radius of the corners of the card, in pixels.
   */
  public readonly radius = signal(8);
  /**
   * The hue of the color of the card.
   */
  public readonly hue = signal(260);
  /**
   * Whether the text of the card is bold.
   */
  public readonly bold = signal(false);
  /**
   * The style properties of the card.
   */
  public readonly styles = computed(() => this._computeStyles());

  /**
   * Sets the width of the card.
   *
   * @param event - The input event of the slider.
   */
  public setWidth(event: Event): void {
    this.width.set((event.target as HTMLInputElement).valueAsNumber);
  }

  /**
   * Sets the radius of the corners of the card.
   *
   * @param event - The input event of the slider.
   */
  public setRadius(event: Event): void {
    this.radius.set((event.target as HTMLInputElement).valueAsNumber);
  }

  /**
   * Sets the hue of the color of the card.
   *
   * @param event - The input event of the slider.
   */
  public setHue(event: Event): void {
    this.hue.set((event.target as HTMLInputElement).valueAsNumber);
  }

  /**
   * Makes the text of the card bold, or not any more.
   */
  public toggleBold(): void {
    this.bold.update(bold => !bold);
  }

  /**
   * Computes the value of `styles`.
   *
   * @returns The properties: units after the dot, a custom property, and no font weight while the text is not bold.
   */
  private _computeStyles(): ElementStyles {
    return {
      'width.%': this.width(),
      'border-radius.px': this.radius(),
      '--hue': this.hue(),
      fontWeight: this.bold() ? 700 : null
    };
  }
}
