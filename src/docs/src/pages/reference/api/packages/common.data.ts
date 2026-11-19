import type { ApiPackage } from '../api.data';
import { ENTRIES, INDENT, IS_EMPTY, IS_NON_EMPTY, KEYS, REMOVE_ITEM, SLICE, SMALL_SET, STACK, TO_KEBAB_CASE, TO_PASCAL_CASE, TO_SAME_ORIGIN_PATH, VALUES } from './common.snippets';

/**
 * The symbols of `@xaendar/common`.
 */
export const COMMON_API: ApiPackage = {
  name: '@xaendar/common',
  symbols: [
    {
      name: 'Stack',
      kind: 'class',
      signature: `class Stack<T = unknown> {
  readonly [index: number]: T;
  constructor();
  get length(): number;
  get values(): T[];
  pop(): T | undefined;
  push(element: T): number;
}`,
      members: [
        { name: 'length', group: 'properties', signature: 'get length(): number' },
        { name: 'values', group: 'properties', signature: 'get values(): T[]' },
        { name: 'push', group: 'methods', signature: 'push(element: T): number' },
        { name: 'pop', group: 'methods', signature: 'pop(): T | undefined' }
      ],
      usage: [{ key: 'pushingAndPopping', snippets: [STACK] }]
    },
    {
      name: 'SmallSet',
      kind: 'type',
      signature: 'type SmallSet<T extends SmallSetItem> = T | T[] | Set<T>',
      usage: [{ key: 'tracking', snippets: [SMALL_SET] }]
    },
    {
      name: 'SmallSetItem',
      kind: 'type',
      signature: 'type SmallSetItem = object & { readonly [Symbol.iterator]?: never }'
    },
    {
      name: 'emptySmallSet',
      kind: 'function',
      signature: 'function emptySmallSet<T extends SmallSetItem>(expectedSize?: number): SmallSet<T>'
    },
    {
      name: 'addToSmallSet',
      kind: 'function',
      signature: 'function addToSmallSet<T extends SmallSetItem>(set: SmallSet<T>, item: T): SmallSet<T>'
    },
    {
      name: 'deleteFromSmallSet',
      kind: 'function',
      signature: 'function deleteFromSmallSet<T extends SmallSetItem>(set: SmallSet<T>, item: T): SmallSet<T>'
    },
    {
      name: 'smallSetHas',
      kind: 'function',
      signature: 'function smallSetHas<T extends SmallSetItem>(set: SmallSet<T>, item: T): boolean'
    },
    {
      name: 'smallSetSize',
      kind: 'function',
      signature: 'function smallSetSize<T extends SmallSetItem>(set: SmallSet<T>): number'
    },
    {
      name: 'forEachInSmallSet',
      kind: 'function',
      signature: 'function forEachInSmallSet<T extends SmallSetItem, Argument>(set: SmallSet<T>, visit: (item: T, argument: Argument) => void, argument: Argument): void'
    },
    {
      name: 'findInSmallSet',
      kind: 'function',
      signature: 'function findInSmallSet<T extends SmallSetItem, Argument>(set: SmallSet<T>, predicate: (item: T, argument: Argument) => boolean, argument: Argument): T | undefined'
    },
    {
      name: 'smallSetToArray',
      kind: 'function',
      signature: 'function smallSetToArray<T extends SmallSetItem>(set: SmallSet<T>): T[]'
    },
    {
      name: 'toPascalCase',
      kind: 'function',
      signature: 'function toPascalCase(str: string): string',
      usage: [{ key: 'converting', snippets: [TO_PASCAL_CASE] }]
    },
    {
      name: 'toKebabCase',
      kind: 'function',
      signature: 'function toKebabCase(str: string): string',
      usage: [{ key: 'converting', snippets: [TO_KEBAB_CASE] }]
    },
    {
      name: 'indent',
      kind: 'function',
      signature: `function indent(lines: string): string;
function indent(lines: string[]): string[];`,
      usage: [{ key: 'indenting', snippets: [INDENT] }]
    },
    {
      name: 'isNonEmpty',
      kind: 'function',
      signature: 'function isNonEmpty<Obj extends object>(object: Obj): object is NonEmptyObject<Obj>',
      usage: [{ key: 'narrowing', snippets: [IS_NON_EMPTY] }]
    },
    {
      name: 'isEmpty',
      kind: 'function',
      signature: 'function isEmpty<Obj extends object>(object: Obj): boolean',
      usage: [{ key: 'whatCounts', snippets: [IS_EMPTY] }]
    },
    {
      name: 'keys',
      kind: 'function',
      signature: `function keys<Obj extends object, Key extends \`\${Exclude<keyof Obj, symbol>}\`>(object: Obj): Key[];
function keys(object: undefined): undefined;
function keys<Obj extends object, Key extends \`\${Exclude<keyof Obj, symbol>}\`>(object: Obj | undefined): Key[] | undefined;`,
      usage: [{ key: 'typedKeys', snippets: [KEYS] }]
    },
    {
      name: 'entries',
      kind: 'function',
      signature: `function entries<Obj extends object, Key extends \`\${Exclude<keyof Obj, symbol>}\`, Value extends Obj[keyof Obj] = Obj[keyof Obj]>(object: Obj): [Key, Value][];
function entries(object: undefined): undefined;
function entries<Obj extends object, Key extends \`\${Exclude<keyof Obj, symbol>}\`, Value extends Obj[keyof Obj] = Obj[keyof Obj]>(object: Obj | undefined): [Key, Value][] | undefined;`,
      usage: [{ key: 'typedPairs', snippets: [ENTRIES] }]
    },
    {
      name: 'values',
      kind: 'function',
      signature: `function values<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj): Value[];
function values(object: undefined): undefined;
function values<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj | undefined): Value[] | undefined;`,
      usage: [{ key: 'typedValues', snippets: [VALUES] }]
    },
    {
      name: 'removeItem',
      kind: 'function',
      signature: 'function removeItem<T>(array: T[], item: T): boolean',
      usage: [{ key: 'removing', snippets: [REMOVE_ITEM] }]
    },
    {
      name: 'slice',
      kind: 'function',
      signature: 'function slice(value: string, start?: number, end?: number): string',
      usage: [{ key: 'keepingAPart', snippets: [SLICE] }]
    },
    {
      name: 'toSameOriginPath',
      kind: 'function',
      signature: 'function toSameOriginPath(url: string): string',
      usage: [{ key: 'serving', snippets: [TO_SAME_ORIGIN_PATH] }],
      guides: ['tools/ssr/overview']
    }
  ]
};
