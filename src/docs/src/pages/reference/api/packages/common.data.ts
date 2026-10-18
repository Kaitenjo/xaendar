import type { ApiPackage } from '../api.data';

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
  [index: number]: T;
  [prop: string | symbol]: unknown;
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
      usage: [{ key: 'pushingAndPopping', snippets: ['api/common/stack.ts'] }]
    },
    {
      name: 'toPascalCase',
      kind: 'function',
      signature: 'function toPascalCase(str: string): string',
      usage: [{ key: 'converting', snippets: ['api/common/to-pascal-case.ts'] }]
    },
    {
      name: 'toKebabCase',
      kind: 'function',
      signature: 'function toKebabCase(str: string): string',
      usage: [{ key: 'converting', snippets: ['api/common/to-kebab-case.ts'] }]
    },
    {
      name: 'indent',
      kind: 'function',
      signature: `function indent(lines: string): string;
function indent(lines: string[]): string[];`,
      usage: [{ key: 'indenting', snippets: ['api/common/indent.ts'] }]
    },
    {
      name: 'isNonEmpty',
      kind: 'function',
      signature: 'function isNonEmpty<Obj extends object>(object: Obj): object is NonEmptyObject<Obj>',
      usage: [{ key: 'narrowing', snippets: ['api/common/is-non-empty.ts'] }]
    },
    {
      name: 'isEmpty',
      kind: 'function',
      signature: 'function isEmpty<Obj extends object>(object: Obj): boolean',
      usage: [{ key: 'whatCounts', snippets: ['api/common/is-empty.ts'] }]
    },
    {
      name: 'keys',
      kind: 'function',
      signature: `function keys<Obj extends object, Key extends keyof Obj>(object: Obj): Key[];
function keys(object: undefined): undefined;`,
      usage: [{ key: 'typedKeys', snippets: ['api/common/keys.ts'] }]
    },
    {
      name: 'entries',
      kind: 'function',
      signature: `function entries<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj): [Key, Value][];
function entries(object: undefined): undefined;`,
      usage: [{ key: 'typedPairs', snippets: ['api/common/entries.ts'] }]
    },
    {
      name: 'values',
      kind: 'function',
      signature: `function values<Obj extends object, Key extends keyof Obj, Value extends Obj[Key] = Obj[Key]>(object: Obj): Value[];
function values(object: undefined): undefined;`,
      usage: [{ key: 'typedValues', snippets: ['api/common/values.ts'] }]
    },
    {
      name: 'slice',
      kind: 'function',
      signature: 'function slice(value: string, start?: number, end?: number): string',
      usage: [{ key: 'keepingAPart', snippets: ['api/common/slice.ts'] }]
    },
    {
      name: 'isValidCustomElementName',
      kind: 'function',
      signature: 'function isValidCustomElementName(tagName: string, logErrors = true): boolean',
      members: [
        { name: 'tagName', group: 'parameters', signature: 'tagName: string' },
        {
          name: 'logErrors',
          group: 'parameters',
          signature: 'logErrors = true',
          snippets: ['api/common/is-valid-custom-element-name-errors.txt']
        }
      ],
      usage: [{ key: 'checking', snippets: ['api/common/is-valid-custom-element-name.ts'] }],
      guides: ['components/registration']
    },
    {
      name: 'matchesCustomElementPattern',
      kind: 'function',
      signature: 'function matchesCustomElementPattern(tagName: string, patterns: readonly string[]): boolean',
      usage: [{ key: 'otherLibraries', snippets: ['api/common/matches-custom-element-pattern.ts'] }],
      guides: ['components/registration']
    }
  ]
};
