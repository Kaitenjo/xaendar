// theme.ts — a module shared by the whole application
import { signal } from '@xaendar/core/signals';

/**
 * The themes of the application.
 */
export type Theme = 'light' | 'dark';

/**
 * The current theme. The inline script of index.html has already applied the stored, or preferred, one.
 */
export const theme = signal<Theme>(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');

/**
 * Switches to the other theme, applies it to the page and remembers it.
 */
export function toggleTheme(): void {
  theme.update(value => (value === 'dark' ? 'light' : 'dark'));
  document.documentElement.dataset['theme'] = theme();
  try {
    localStorage.setItem('theme', theme());
  } catch {
    // Storage may be unavailable: the theme still applies, it is just not remembered
  }
}
