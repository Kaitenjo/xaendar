/**
 * The style properties `@@style` gives its element (see `StyleDirective`), by name: in kebab-case or in camelCase,
 * followed by its unit, if any (`width.px`), or a custom property (`--accent`), each set to a string or a number, with
 * `!important` when the value ends with it, or to nothing (`null`, `undefined`, `''`); or nothing at all.
 */
export type ElementStyles = Readonly<Record<string, string | number | null | undefined>> | null | undefined;
