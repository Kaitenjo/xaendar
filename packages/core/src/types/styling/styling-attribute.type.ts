/**
 * The attributes whose values are merged key by key among the sources writing them (see `StylingState`): `class`, whose
 * keys are the classes, `style`, whose keys are the properties, and `part`, whose keys are the parts the element
 * exposes to `::part()`.
 */
export type StylingAttribute = 'class' | 'style' | 'part';
