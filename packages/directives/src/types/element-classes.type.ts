/**
 * The classes `@@class` gives its element (see `ClassDirective`): a string of classes separated by spaces, a list or a
 * set of classes, or an object whose keys are classes, each given when its value is truthy (a key can hold several
 * classes separated by spaces), or nothing (`null`, `undefined`).
 */
export type ElementClasses = string | readonly string[] | ReadonlySet<string> | Readonly<Record<string, unknown>> | null | undefined;
