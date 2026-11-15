import type { HtmlAttributePolicy } from '../../types/html-attribute-policy.type';
import type { HtmlNamePolicy } from '../../types/html-name-policy.type';
import { toAsciiLowerCase } from '../html-syntax/html-syntax.utils';

/**
 * The names a prefix (`data-*`) lets through: letters, digits, `-`, `_`, `.` and `:` after a letter, lowercase.
 */
const PREFIXED_NAME = /^[a-z][a-z0-9._:-]*$/;

/**
 * An attribute of the options listed for an element only: `element[attribute]`.
 */
const SCOPED_ATTRIBUTE = /^[^[\]]+\[[^[\]]+\]$/;

/**
 * The names allowed by default on an element only: none.
 */
const NO_NAMES: ReadonlySet<string> = new Set();

/**
 * Creates the names the sanitizer keeps from the default ones and the ones of the options: a name ending with `*` is a
 * prefix, the others are matched as they are, without regard to case.
 *
 * @param defaults - The names kept by default, lowercase.
 * @param defaultPrefixes - The prefixes kept by default, lowercase, `null` when there are none.
 * @param allow - The names kept besides the default ones.
 * @param remove - The names removed among the ones kept.
 * @returns The names kept.
 */
export function createNamePolicy(defaults: ReadonlySet<string>, defaultPrefixes: readonly string[] | null, allow: readonly string[] | undefined, remove: readonly string[] | undefined): HtmlNamePolicy {
  let allowed = defaults;
  let allowedPrefixes = defaultPrefixes;
  if (allow?.length) {
    const names = new Set(defaults);
    for (let i = 0; i < allow.length; i++) {
      const name = toAsciiLowerCase(allow[i]);
      if (name.endsWith('*')) {
        const prefix = name.slice(0, -1);
        allowedPrefixes = allowedPrefixes === null ? [prefix] : allowedPrefixes.concat(prefix);
      } else {
        names.add(name);
      }
    }

    allowed = names;
  }

  let removed: Set<string> | null = null;
  let removedPrefixes: string[] | null = null;
  if (remove?.length) {
    for (let i = 0; i < remove.length; i++) {
      const name = toAsciiLowerCase(remove[i]);
      if (!name.endsWith('*')) {
        (removed ??= new Set()).add(name);
      } else if (removedPrefixes === null) {
        removedPrefixes = [name.slice(0, -1)];
      } else {
        removedPrefixes.push(name.slice(0, -1));
      }
    }
  }

  return { allowed, allowedPrefixes, removed, removedPrefixes };
}

/**
 * Creates the attributes the sanitizer keeps from the default ones and the ones of the options, as
 * {@link createNamePolicy} does: an `element[attribute]` (`span[style]`, `img[data-*]`) is kept, or removed, on that
 * element only.
 *
 * @param defaults - The attributes kept by default on every element, lowercase.
 * @param defaultPrefixes - The prefixes kept by default on every element, lowercase, `null` when there are none.
 * @param allow - The attributes kept besides the default ones.
 * @param remove - The attributes removed among the ones kept.
 * @returns The attributes kept.
 */
export function createAttributePolicy(defaults: ReadonlySet<string>, defaultPrefixes: readonly string[] | null, allow: readonly string[] | undefined, remove: readonly string[] | undefined): HtmlAttributePolicy {
  const scopedAllow = selectAttributes(allow, true);
  const scopedRemove = selectAttributes(remove, true);
  return {
    global: createNamePolicy(defaults, defaultPrefixes, selectAttributes(allow, false), selectAttributes(remove, false)),
    scoped: scopedAllow?.length || scopedRemove?.length ? createNamePolicy(NO_NAMES, null, scopedAllow, scopedRemove) : null
  };
}

/**
 * Tells whether the sanitizer keeps a name: one allowed, by name or by prefix, and not removed. A name allowed only by
 * a prefix is made only of letters, digits, `-`, `_`, `.` and `:`.
 *
 * @param policy - The names kept.
 * @param name - The name of an element or of an attribute, its ASCII letters lowercase.
 * @returns Whether the name is kept.
 */
export function isAllowedName(policy: HtmlNamePolicy, name: string): boolean {
  return !isRemovedName(policy, name) && isListedName(policy, name, name);
}

/**
 * Tells whether the sanitizer keeps an attribute on an element: allowed on every element or on that one, and removed
 * from neither.
 *
 * @param policy - The attributes kept.
 * @param element - The name of the element, lowercase.
 * @param name - The name of the attribute, lowercase.
 * @returns Whether the attribute is kept.
 */
export function isAllowedAttribute(policy: HtmlAttributePolicy, element: string, name: string): boolean {
  const scoped = policy.scoped;
  if (scoped === null) {
    return isAllowedName(policy.global, name);
  }

  const key = `${element}[${name}`;
  if (isRemovedName(policy.global, name) || isRemovedName(scoped, key)) {
    return false;
  }

  return isListedName(policy.global, name, name) || isListedName(scoped, key, name);
}

/**
 * Selects the attributes of the options listed for every element, or the ones listed for an element only, the latter
 * as `element[attribute` (`span[style]` → `span[style`, `img[data-*]` → `img[data-*`).
 *
 * @param names - The attributes of the options.
 * @param scoped - Whether to select the attributes of an element only.
 * @returns The attributes selected, `undefined` without options.
 */
function selectAttributes(names: readonly string[] | undefined, scoped: boolean): readonly string[] | undefined {
  if (!names?.length) {
    return undefined;
  }

  const selected = names.filter(name => SCOPED_ATTRIBUTE.test(name) === scoped);
  return scoped ? selected.map(name => name.slice(0, -1)) : selected;
}

/**
 * Tells whether a name is removed, by name or by prefix.
 *
 * @param policy - The names kept.
 * @param key - The name looked for.
 * @returns Whether it is removed.
 */
function isRemovedName(policy: HtmlNamePolicy, key: string): boolean {
  return policy.removed?.has(key) || hasPrefix(policy.removedPrefixes, key);
}

/**
 * Tells whether a name is allowed, by name or by prefix: the latter only for a name made of letters, digits, `-`, `_`,
 * `.` and `:`.
 *
 * @param policy - The names kept.
 * @param key - The name looked for: the name, or `element[attribute` for an attribute of an element only.
 * @param name - The name of the element or of the attribute.
 * @returns Whether it is allowed.
 */
function isListedName(policy: HtmlNamePolicy, key: string, name: string): boolean {
  return policy.allowed.has(key) || (hasPrefix(policy.allowedPrefixes, key) && PREFIXED_NAME.test(name));
}

/**
 * Tells whether a name starts with one of some prefixes.
 *
 * @param prefixes - The prefixes, `null` when there are none.
 * @param name - The name.
 * @returns Whether the name starts with one of them.
 */
function hasPrefix(prefixes: readonly string[] | null, name: string): boolean {
  return prefixes !== null && prefixes.some(prefix => name.startsWith(prefix));
}
