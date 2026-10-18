import { entries } from '@xaendar/common';

/**
 * The custom properties of a theme.
 */
const theme = { accent: '#4f46e5', radius: '8px' };

entries(theme);                  // [['accent', '#4f46e5'], ['radius', '8px']], typed ['accent' | 'radius', string][]
entries({ id: 1, name: 'Ada' }); // typed ['id' | 'name', string | number][]: a key is not tied to its value
entries(undefined);              // undefined

/**
 * The properties to set on the page.
 */
const properties = entries(theme);
for (let i = 0; i < properties.length; i++) {
  const [name, value] = properties[i];
  document.documentElement.style.setProperty(`--${name}`, value);
}
