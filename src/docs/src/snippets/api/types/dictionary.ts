import type { Dictionary } from '@xaendar/types';

/**
 * The label of the button, in the languages that have one.
 */
const labels: Dictionary<'en' | 'it' | 'fr'> = { en: 'Save', it: 'Salva' };

labels.en; // 'Save', typed string | undefined
labels.fr; // undefined: every key is optional
labels.de; // ✗ Property 'de' does not exist on type 'Dictionary<"en" | "it" | "fr">'.

/**
 * The number of visits, by page: any string is a key.
 */
const visits: Dictionary<string, number> = {};
visits['/home']; // undefined, typed number | undefined
