import { _SERVER_STYLE_ATTRIBUTE } from '@xaendar/core';
import { escapeRawText, parseStyleDeclarations } from '@xaendar/internals';
import type { ServerOutput } from '../../types/server-output.type';
import type { ServerStyles } from '../../types/server-styles.type';
import { writeNonceAttribute } from '../escape/escape.util';

/**
 * The name of a property a rule declares: a custom property, or one of CSS, with its vendor prefix if any.
 */
const PROPERTY_NAME = /^(?:--[\w-]+|-?[a-z_][\w-]*)$/i;

/**
 * The selectors the selector of a rule holds besides the attribute of its elements, which raise its specificity to the
 * one of five IDs: no element matches them, since an element has a single ID.
 *
 * N.B. The rule stands for the `style` attribute of its elements, which wins over every selector of the stylesheets:
 * `:is()` takes the specificity of its most specific selector, so that the rule wins over every selector with fewer IDs,
 * as `.card .title` of the stylesheet of a component, which would win over the attribute alone, and a `style` attribute
 * would not lose to. Do not write the rule with the attribute alone, nor with `!important`, which would win over the
 * animations and the `!important` of the stylesheets, as the `style` attribute does not.
 */
const NEVER_MATCHING = '#a#b#c#d#e';

/**
 * Moves the inline style of an element into the rules of its tree, as the block of declarations of a rule: the index of
 * the rule, which the element holds in its `data-xd-style` attribute in place of its `style` attribute. The elements
 * with the same declarations share a rule.
 *
 * @param styles - The inline styles of the tree.
 * @param text - The text of the `style` attribute of the element.
 * @returns The index of the rule, `undefined` when the attribute holds no declaration that can be moved.
 */
export function addStyleRule(styles: ServerStyles, text: string): number | undefined {
  const block = toDeclarationBlock(text);
  if (block === undefined) {
    return undefined;
  }

  const { blocks } = styles;
  const index = blocks?.get(block);
  if (index !== undefined) {
    return index;
  }

  const added = blocks ? blocks.size : 0;
  blocks ? blocks.set(block, added) : styles.blocks = new Map([[block, added]]);
  return added;
}

/**
 * Writes the `<style>` of a tree, holding the rules of the inline styles of its elements, with the nonce of the
 * `Content-Security-Policy` of the response.
 *
 * @param styles - The inline styles of the tree.
 * @param nonce - The nonce, if any.
 * @returns The `<style>`, an empty string when no element of the tree has an inline style.
 */
export function writeStyleElement(styles: ServerStyles, nonce: string | undefined): string {
  const { blocks } = styles;
  if (!blocks?.size) {
    return '';
  }

  let css = '';
  for (const [block, index] of blocks) {
    css = `${css}:is([${_SERVER_STYLE_ATTRIBUTE}="${index}"],${NEVER_MATCHING}){${block}}`;
  }

  return `<style ${_SERVER_STYLE_ATTRIBUTE}=""${writeNonceAttribute(nonce)}>${escapeRawText(css, 'style')}</style>`;
}

/**
 * Writes the `<style>` of a declarative shadow root once its content is rendered (see {@link writeStyleElement}): at
 * once, or, while a part of the content rendered later is pending, the promise of it, which settles once every part has,
 * since their elements add rules too.
 *
 * @param content - The output of the content of the shadow root.
 * @param styles - The inline styles of the shadow root.
 * @param nonce - The nonce of the `Content-Security-Policy` of the response, if any.
 * @returns The `<style>`, or the promise of the output holding it.
 */
export function writeShadowStyles(content: ServerOutput, styles: ServerStyles, nonce: string | undefined): string | Promise<ServerOutput> {
  return content.some(part => typeof part !== 'string')
    ? settle(content).then(() => [writeStyleElement(styles, nonce)])
    : writeStyleElement(styles, nonce);
}

/**
 * Waits for the parts of an output rendered later, and for the ones of their own output.
 *
 * @param output - The output.
 * @returns A promise resolving once every part is rendered.
 */
async function settle(output: ServerOutput): Promise<void> {
  for (let i = 0; i < output.length; i++) {
    const part = output[i];
    if (typeof part !== 'string') {
      await settle(await part);
    }
  }
}

/**
 * Writes the declarations of the text of a `style` attribute as the block of a rule, each one whose name is a property
 * and whose value stays inside its declaration, with its `!important` (see {@link staysInDeclaration}).
 *
 * @param text - The text of the attribute.
 * @returns The block, without its braces, `undefined` when no declaration is kept.
 */
function toDeclarationBlock(text: string): string | undefined {
  const declarations = parseStyleDeclarations(text);
  let block: string | undefined;
  if (declarations?.length) {
    for (let i = 0; i < declarations.length; i += 2) {
      const name = declarations[i];
      const value = declarations[i + 1];
      if (PROPERTY_NAME.test(name) && staysInDeclaration(value)) {
        block = block ? `${block} ${name}: ${value};` : `${name}: ${value};`;
      }
    }
  }

  return block;
}

/**
 * Tells whether a value, written into the block of a rule, stays inside its declaration: no `;` outside parentheses
 * and brackets ends it, no brace ends the block, no comment takes in what follows, no string, parenthesis or bracket is
 * left open, and no backslash escapes what follows the value or ends a line. A `style` attribute holds its declarations
 * alone, so a value it keeps can still end the rule of a stylesheet and add others.
 *
 * N.B. A value bound to the style of an element may come from a user, and written into the `<style>` of the page it
 * would style any element, of the page or of the shadow root, in place of its own, which its `style` attribute could
 * not: the value is left out, as the browser ignores it in the attribute. Do not write it as it is.
 *
 * @param value - The value.
 * @returns `true` when it stays inside its declaration.
 */
function staysInDeclaration(value: string): boolean {
  // The closing parentheses and brackets expected, the last one first
  let closing = '';
  let quote = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '\\') {
      // An escape takes the next character, which ends no line
      if (endsLine(value[i + 1])) {
        return false;
      }

      i++;
    } else if (quote) {
      if (char === quote) {
        quote = '';
      } else if (endsLine(char)) {
        return false;
      }
    } else {
      switch (char) {
        case '"':
        case '\'':
          quote = char;
          break;

        case '(':
          closing = `${closing})`;
          break;

        case '[':
          closing = `${closing}]`;
          break;

        case ')':
        case ']':
          if (!closing.endsWith(char)) {
            return false;
          }

          closing = closing.slice(0, -1);
          break;

        case '{':
        case '}':
          return false;

        case ';':
          if (!closing) {
            return false;
          }
          break;

        case '/':
          if (value[i + 1] === '*') {
            return false;
          }
          break;
      }
    }
  }

  return !quote && !closing;
}

/**
 * Tells whether a character ends a line in CSS, which neither an escape nor a string may hold: the end of the value, a
 * line feed, a carriage return or a form feed.
 *
 * @param char - The character, `undefined` past the end of the value.
 * @returns `true` when it ends a line.
 */
function endsLine(char: string | undefined): boolean {
  return char === undefined || char === '\n' || char === '\r' || char === '\f';
}
