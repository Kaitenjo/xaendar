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
export const theme = signal<Theme>(getDefaultThemeValue());


function getDefaultThemeValue(): Theme {
  let storageValue: string | null | undefined = localStorage.getItem(THEME_STORAGE_KEY);
  if (storageValue === 'light' || storageValue === 'dark') {
    document.documentElement.dataset['theme'] = storageValue;
    return storageValue;
  }

  storageValue = document.documentElement.dataset['theme'];
  if (storageValue === 'light' || storageValue === 'dark') {
    return storageValue;
  }

  document.documentElement.dataset['theme'] = 'dark';
  return 'dark';
}

/**
 * Switches between the light and the dark theme, and remembers the choice.
 */
export function toggleTheme(): void {
  theme.update(value => {
    const retVal = value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset['theme'] = retVal;
    localStorage.setItem(THEME_STORAGE_KEY, retVal);
    return retVal;
  });
}
