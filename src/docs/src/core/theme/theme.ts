import { signal } from '@xaendar/core/signals';

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
export const theme = signal<Theme>(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');

/**
 * Switches between the light and the dark theme, and remembers the choice.
 */
export function toggleTheme(): void {
  theme.update(value => value === 'dark' ? 'light' : 'dark');

  document.documentElement.dataset['theme'] = theme();
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme());
  } catch {
    // The theme is still applied, it just won't be remembered
  }
}
