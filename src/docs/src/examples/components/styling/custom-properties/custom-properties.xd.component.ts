import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Themes two buttons from outside: custom properties are inherited through the shadow root, like color and font.
 */
@WebComponent({
  selector: 'ex-custom-properties',
  templateUrl: './custom-properties.xd.component.html',
  styleUrl: './custom-properties.css'
})
export class CustomPropertiesComponent extends CustomElement {
  /**
   * The accent colors to choose from.
   */
  public readonly accents = ['#6750a4', '#00796b', '#d32f2f'];

  /**
   * The chosen accent color.
   */
  public readonly accent = signal('#6750a4');

  /**
   * Whether the buttons are fully rounded.
   */
  public readonly rounded = signal(true);

  /**
   * The custom properties set on the container of the buttons.
   */
  public readonly theme = computed(() => '--accent: ' + this.accent() + '; --radius: ' + (this.rounded() ? '999px' : '4px'));

  /**
   * Chooses an accent color.
   *
   * @param color - The color.
   */
  public pickAccent(color: string): void {
    this.accent.set(color);
  }

  /**
   * Toggles the rounded corners.
   */
  public toggleRounded(): void {
    this.rounded.update(rounded => !rounded);
  }
}
