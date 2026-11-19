import type { ElementClasses } from '../../types/element-classes.type';

/**
 * Gives the `class` string of the classes `@@class` binds (see `ElementClasses`): a string as it is, the classes of a
 * list or of a set, the keys of an object whose value is truthy, separated by spaces.
 *
 * @param classes - The classes.
 * @returns The string, `undefined` for `null` and `undefined`, which give no class.
 */
export function toClassString(classes: ElementClasses): string | undefined {
  if (classes === null || classes === undefined) {
    return undefined;
  }

  if (typeof classes === 'string') {
    return classes;
  }

  if (Symbol.iterator in classes) {
    return Array.from(classes as Iterable<string>).join(' ');
  }

  const keys = Object.keys(classes);
  const present = new Array<string>();
  for (let i = 0; i < keys.length; i++) {
    if ((classes as Readonly<Record<string, unknown>>)[keys[i]]) {
      present.push(keys[i]);
    }
  }

  return present.join(' ');
}
