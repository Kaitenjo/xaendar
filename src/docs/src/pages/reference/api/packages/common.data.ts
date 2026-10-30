import type { ApiPackage } from '../api.data';
import { DROPS_LEADING_NEWLINE, ENTRIES, ESCAPE_ATTRIBUTE, ESCAPE_RAW_TEXT, ESCAPE_TEXT, INDENT, IS_EMPTY, IS_NON_EMPTY, IS_RAW_TEXT_ELEMENT, IS_VALID_CUSTOM_ELEMENT_NAME, IS_VOID_ELEMENT, KEYS, MATCHES_CUSTOM_ELEMENT_PATTERN, REMOVE_ITEM, SLICE, STACK, TO_KEBAB_CASE, TO_PASCAL_CASE, VALUES } from './common.snippets';

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
      usage: [{ key: 'checking', snippets: [IS_VALID_CUSTOM_ELEMENT_NAME] }],
      guides: ['components/registration']
    },
    {
      name: 'matchesCustomElementPattern',
      kind: 'function',
      signature: 'function matchesCustomElementPattern(tagName: string, patterns: readonly string[]): boolean',
      usage: [{ key: 'otherLibraries', snippets: [MATCHES_CUSTOM_ELEMENT_PATTERN] }],
      guides: ['components/registration']
    },
    {
      name: 'escapeText',
      kind: 'function',
      signature: 'function escapeText(value: string): string',
      usage: [{ key: 'escaping', snippets: [ESCAPE_TEXT] }],
      guides: ['tools/ssr']
    },
    {
      name: 'escapeAttribute',
      kind: 'function',
      signature: 'function escapeAttribute(value: string): string',
      usage: [{ key: 'escaping', snippets: [ESCAPE_ATTRIBUTE] }],
      guides: ['tools/ssr']
    },
    {
      name: 'escapeRawText',
      kind: 'function',
      signature: 'function escapeRawText(value: string, tagName: string): string',
      usage: [{ key: 'rawText', snippets: [ESCAPE_RAW_TEXT] }],
      guides: ['tools/ssr']
    },
    {
      name: 'isVoidElement',
      kind: 'function',
      signature: 'function isVoidElement(tagName: string): boolean',
      usage: [{ key: 'checking', snippets: [IS_VOID_ELEMENT] }],
      guides: ['tools/ssr']
    },
    {
      name: 'isRawTextElement',
      kind: 'function',
      signature: 'function isRawTextElement(tagName: string): boolean',
      usage: [{ key: 'checking', snippets: [IS_RAW_TEXT_ELEMENT] }],
      guides: ['tools/ssr']
    },
    {
      name: 'dropsLeadingNewline',
      kind: 'function',
      signature: 'function dropsLeadingNewline(tagName: string): boolean',
      usage: [{ key: 'writing', snippets: [DROPS_LEADING_NEWLINE] }],
      guides: ['tools/ssr']
    }
  ]
};
