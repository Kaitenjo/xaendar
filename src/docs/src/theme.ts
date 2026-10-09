/**
 * The theme to apply before the first paint: the stored choice, or the preference of the system.
 */
let theme;
try {
  theme = localStorage.getItem('xaendar-docs-theme');
} catch {
  theme = null;
}

if (theme !== 'light' && theme !== 'dark') {
  theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.documentElement.dataset.theme = theme;