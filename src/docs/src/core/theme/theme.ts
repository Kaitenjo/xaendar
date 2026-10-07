import { signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';

/**
 * Color themes of the documentation.
 */
export type Theme = 'light' | 'dark';

/**
 * Key under which the theme chosen by the reader is stored. Also read by the inline script of
 * `index.html`, which applies the theme before the first paint.
 */
const THEME_STORAGE_KEY = 'xaendar-docs-theme';

/**
 * The theme currently applied, as set on `<html data-theme>` by `index.html`.
 */
export const theme: Signal<Theme> = signal<Theme>(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');

/**
 * Switches between the light and the dark theme, and remembers the choice.
 */
export function toggleTheme(): void {
  const next: Theme = theme() === 'dark' ? 'light' : 'dark';
  theme.set(next);
  document.documentElement.dataset['theme'] = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // The theme is still applied, it just won't be remembered
  }
}
