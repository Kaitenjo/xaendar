import { toCssPropertyName } from '@xaendar/common';
import { dirname, join } from 'node:path';
import { getDefaultLibFilePath, sys } from 'typescript';

/**
 * Matches the start of a declaration of `CSSStyleDeclaration`, or of `CSSStyleProperties` it extends in the recent
 * versions of TypeScript, which declare the CSS properties.
 */
const DECLARATION_RE = /interface CSSStyle(?:Declaration|Properties)\b[^{]*\{/g;

/**
 * Matches a property of `CSSStyleDeclaration` holding a string, capturing its name: the CSS properties, in camelCase.
 */
const PROPERTY_RE = /^ {4}(\w+): string;$/gm;

/**
 * The members of `CSSStyleDeclaration` holding a string that are not CSS properties, or not by their name.
 */
const NOT_PROPERTIES: ReadonlySet<string> = new Set(['cssText', 'cssFloat']);

/**
 * The CSS properties, read once.
 */
let properties: readonly string[] | undefined;

/**
 * Gives the CSS properties a style binding can set (`[style.name]`), in kebab-case, as CSS writes them: read once from
 * the members of `CSSStyleDeclaration` in the declaration file of the DOM TypeScript ships, so that they follow the
 * version of TypeScript, `float` included.
 *
 * @param readFile - Reads a file, the one of TypeScript by default.
 * @returns The properties, in alphabetical order, `float` alone when the file cannot be read.
 */
export function getCssProperties(readFile: (path: string) => string | undefined = sys.readFile): readonly string[] {
  if (properties) {
    return properties;
  }

  const source = readFile(join(dirname(getDefaultLibFilePath({})), 'lib.dom.d.ts')) ?? '';
  const names = new Set<string>(['float']);
  for (const { index } of source.matchAll(DECLARATION_RE)) {
    for (const [, name] of source.slice(index, source.indexOf('\n}', index)).matchAll(PROPERTY_RE)) {
      if (!NOT_PROPERTIES.has(name)) {
        // The vendor prefixes start with a dash in CSS: `webkitTransform` is `-webkit-transform`
        names.add(name.startsWith('webkit') ? `-${toCssPropertyName(name)}` : toCssPropertyName(name));
      }
    }
  }

  properties = [...names].sort();
  return properties;
}

/**
 * Forgets the CSS properties read: a helper of the tests, which read them from another file.
 */
export function _resetCssProperties(): void {
  properties = undefined;
}
