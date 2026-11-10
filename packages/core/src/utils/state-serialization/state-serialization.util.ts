/**
 * The key of the object standing for a value JSON cannot hold, such as `undefined` or a `Map`: the keys of a plain
 * object starting with it get one more in front, so that no plain object is read back as one of those values.
 */
const TAG = '$';

/**
 * Writes a value the server sends to the browser, such as the inputs of a component or the transfer state, as JSON:
 * besides what JSON holds, `undefined`, `NaN`, `±Infinity`, `-0`, a `bigint`, a `Date`, a `Map` and a `Set`, read back
 * as they are by {@link _parseState}. An object referenced twice is written twice.
 *
 * @param value - The value.
 * @param path - What the value is, named by the errors (`inputs`).
 * @returns The JSON.
 * @throws When the value holds something the HTML cannot carry: a function, a symbol, an instance of another class, or
 *   an object containing itself, the error naming where it is (`inputs.product.onSave`).
 */
export function _stringifyState(value: unknown, path: string): string {
  return JSON.stringify(encode(value, path, new Set()));
}

/**
 * Reads back a value written by {@link _stringifyState}.
 *
 * @param json - The JSON.
 * @returns The value.
 */
export function _parseState<T = unknown>(json: string): T {
  return decode(JSON.parse(json)) as T;
}

/**
 * Turns a value into one JSON holds as it is.
 *
 * @param value - The value.
 * @param path - Where the value is.
 * @param ancestors - The objects containing the value.
 * @returns The value JSON holds.
 * @throws When the value holds something the HTML cannot carry.
 */
function encode(value: unknown, path: string, ancestors: Set<object>): unknown {
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value;
    case 'number':
      return Number.isFinite(value) && !Object.is(value, -0) ? value : { [TAG]: Object.is(value, -0) ? '-0' : String(value) };
    case 'undefined':
      return { [TAG]: 'undefined' };
    case 'bigint':
      return { [TAG]: 'bigint', value: value.toString() };
    case 'object':
      return value === null ? null : encodeObject(value, path, ancestors);
    default:
      throw new Error(`${path} is a ${typeof value}, which cannot be written into the HTML: pass the data it is built from, and build it in the component`);
  }
}

/**
 * Turns an object into one JSON holds as it is: an array, a `Date`, a `Map`, a `Set` or a plain object, whose items,
 * entries and properties are turned the same way.
 *
 * @param value - The object.
 * @param path - Where the object is.
 * @param ancestors - The objects containing the object.
 * @returns The object JSON holds.
 * @throws When the object is an instance of another class or contains itself, or holds something the HTML cannot carry.
 */
function encodeObject(value: object, path: string, ancestors: Set<object>): unknown {
  if (ancestors.has(value)) {
    throw new Error(`${path} contains itself, which cannot be written into the HTML`);
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      // Array.from visits the holes too, written as undefined
      return Array.from(value, (item, index) => encode(item, `${path}[${index}]`, ancestors));
    }

    if (value instanceof Date) {
      return { [TAG]: 'Date', value: encode(value.getTime(), path, ancestors) };
    }

    if (value instanceof Map) {
      const entries = new Array<[unknown, unknown]>();
      for (const [key, item] of value) {
        entries.push([encode(key, `${path}.keys()[${entries.length}]`, ancestors), encode(item, `${path}.get(${String(key)})`, ancestors)]);
      }

      return { [TAG]: 'Map', value: entries };
    }

    if (value instanceof Set) {
      const items = new Array<unknown>();
      for (const item of value) {
        items.push(encode(item, `${path}.values()[${items.length}]`, ancestors));
      }

      return { [TAG]: 'Set', value: items };
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${path} is an instance of ${prototype.constructor?.name ?? 'a class'}, which cannot be written into the HTML: pass a plain object, an array, a Date, a Map or a Set`);
    }

    const encoded: Record<string, unknown> = {};
    const names = Object.keys(value);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const property = /^[A-Za-z_$][\w$]*$/.test(name) ? `${path}.${name}` : `${path}[${JSON.stringify(name)}]`;
      defineProperty(encoded, name.startsWith(TAG) ? `${TAG}${name}` : name, encode((value as Record<string, unknown>)[name], property, ancestors));
    }

    return encoded;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Turns a value read from JSON back into the one {@link encode} turned.
 *
 * @param value - The value read from JSON.
 * @returns The value.
 */
function decode(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(decode);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const tagged = value as { [TAG]?: string, value?: unknown };
  if (Object.hasOwn(tagged, TAG)) {
    switch (tagged[TAG]) {
      case 'undefined':
        return undefined;
      case 'bigint':
        return BigInt(tagged.value as string);
      case 'Date':
        return new Date(decode(tagged.value) as number);
      case 'Map':
        return new Map((tagged.value as Array<[unknown, unknown]>).map(([key, item]) => [decode(key), decode(item)]));
      case 'Set':
        return new Set((tagged.value as unknown[]).map(decode));
      default:
        // NaN, Infinity, -Infinity and -0
        return Number(tagged[TAG]);
    }
  }

  const decoded: Record<string, unknown> = {};
  const names = Object.keys(value);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    defineProperty(decoded, name.startsWith(TAG) ? name.slice(TAG.length) : name, decode((value as Record<string, unknown>)[name]));
  }

  return decoded;
}

/**
 * Adds a property to an object as an assignment of a plain object adds it, without the setter of `__proto__`: a
 * property named `__proto__` stays a property, instead of replacing the prototype of the object.
 *
 * @param target - The object.
 * @param name - The name of the property.
 * @param value - The value of the property.
 */
function defineProperty(target: Record<string, unknown>, name: string, value: unknown): void {
  Object.defineProperty(target, name, { value, enumerable: true, writable: true, configurable: true });
}
