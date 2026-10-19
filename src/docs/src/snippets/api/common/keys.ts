import { keys } from '@xaendar/common';

/**
 * The height of each panel, in pixels.
 */
const heights = { header: 64, content: 480, footer: 48 };

Object.keys(heights); // ['header', 'content', 'footer'], typed string[]
keys(heights);        // ['header', 'content', 'footer'], typed ('header' | 'content' | 'footer')[]
keys({ 1: 'one' });   // ['1'], typed '1'[]: Object.keys always returns strings
keys(undefined);      // undefined

/**
 * The names of the panels.
 */
const panels = keys(heights);
/**
 * The height of the page.
 */
let total = 0;
for (let i = 0; i < panels.length; i++) {
  total += heights[panels[i]]; // a key of heights: no cast needed
}
