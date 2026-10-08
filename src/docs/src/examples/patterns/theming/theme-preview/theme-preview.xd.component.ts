import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Themes applied to components through custom properties and parts.
 */
@WebComponent({
  selector: 'ex-theme-preview',
  templateUrl: './theme-preview.xd.component.html',
  styleUrl: './theme-preview.css'
})
export class ThemePreviewComponent extends CustomElement {
  /**
   * The current theme.
   */
  public readonly theme = signal('light');

  /**
   * The accent color.
   */
  public readonly accent = signal('#5b45e8');

  /**
   * Picks a theme.
   *
   * @param event - The change event of the select.
   */
  public pickTheme(event: Event): void {
    this.theme.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Picks the accent color.
   *
   * @param event - The input event of the color field.
   */
  public pickAccent(event: Event): void {
    this.accent.set((event.target as HTMLInputElement).value);
  }
}
