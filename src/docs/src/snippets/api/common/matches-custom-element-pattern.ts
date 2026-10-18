import { matchesCustomElementPattern } from '@xaendar/common';

/**
 * The tags of other libraries, as declared in customElements of xaendar.json.
 */
const patterns = ['sl-*', 'vanilla-stars'];

matchesCustomElementPattern('sl-button', patterns);       // true
matchesCustomElementPattern('sl-icon-button', patterns);  // true: * matches hyphens too
matchesCustomElementPattern('vanilla-stars', patterns);   // true
matchesCustomElementPattern('vanilla-stars-2', patterns); // false: a pattern matches the whole name
matchesCustomElementPattern('xsl-button', patterns);      // false
matchesCustomElementPattern('sl-button', []);             // false: no patterns, no match
