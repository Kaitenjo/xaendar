import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `entries.ts`, shown by the API reference of common.
 */
export const ENTRIES: SourceFile = {
  name: 'entries.ts',
  lang: 'ts',
  code: `import { entries } from '@xaendar/common';

/**
 * The custom properties of a theme.
 */
const theme = { accent: '#4f46e5', radius: '8px' };

entries(theme);                  // [['accent', '#4f46e5'], ['radius', '8px']], typed ['accent' | 'radius', string][]
entries({ id: 1, name: 'Ada' }); // typed ['id' | 'name', string | number][]: a key is not tied to its value
entries(undefined);              // undefined

/**
 * The properties to set on the page.
 */
const properties = entries(theme);
for (let i = 0; i < properties.length; i++) {
  const [name, value] = properties[i];
  document.documentElement.style.setProperty(\`--\${name}\`, value);
}`
};

/**
 * The snippet `indent.ts`, shown by the API reference of common.
 */
export const INDENT: SourceFile = {
  name: 'indent.ts',
  lang: 'ts',
  code: `import { indent } from '@xaendar/common';

indent('return value;');                   // '  return value;'
indent(['if (ready) {', '  run();', '}']); // ['  if (ready) {', '    run();', '  }']
indent(indent(['run();']));                // ['    run();']: one level per call

/**
 * A block of three lines, in one string.
 */
const block = 'if (ready) {\\n  run();\\n}';

indent(block);                             // ✗ '  if (ready) {\\n  run();\\n}': only the first line is indented
indent(block.split('\\n')).join('\\n');      // ✓ '  if (ready) {\\n    run();\\n  }'`
};

/**
 * The snippet `is-empty.ts`, shown by the API reference of common.
 */
export const IS_EMPTY: SourceFile = {
  name: 'is-empty.ts',
  lang: 'ts',
  code: `import { isEmpty } from '@xaendar/common';

isEmpty({});                     // true
isEmpty({ page: 1 });            // false
isEmpty({ page: undefined });    // false: the key counts, whatever its value
isEmpty([]);                     // true: an array is an object, its indexes are its keys
isEmpty(new Map([['page', 1]])); // true: the entries of a Map are not properties, check its size
isEmpty({ [Symbol('id')]: 1 });  // true: symbol keys are not counted`
};

/**
 * The snippet `is-non-empty.ts`, shown by the API reference of common.
 */
export const IS_NON_EMPTY: SourceFile = {
  name: 'is-non-empty.ts',
  lang: 'ts',
  code: `import { isNonEmpty } from '@xaendar/common';
import type { RequireOne } from '@xaendar/types';

/**
 * The filters of a search, each one optional.
 */
type Filters = {
  /**
   * A text the name contains.
   */
  name?: string;
  /**
   * A tag of the item.
   */
  tag?: string;
};

/**
 * Runs a search. Without filters it would return every item, so it needs at least one.
 *
 * @param filters - The filters, at least one of them.
 */
function search(filters: RequireOne<Filters>): void {
  console.log('Searching', filters);
}

/**
 * Searches with the filters typed in a form, if any.
 *
 * @param filters - The filters typed in the form.
 */
function submit(filters: Filters): void {
  search(filters);   // ✗ Argument of type 'Filters' is not assignable to parameter of type 'RequireOne<Filters>'.
  if (isNonEmpty(filters)) {
    search(filters); // ✓ here filters has at least one key
  }
}

isNonEmpty({ name: undefined }); // true: a key counts, whatever its value`
};

/**
 * The snippet `is-valid-custom-element-name.ts`, shown by the API reference of common.
 */
export const IS_VALID_CUSTOM_ELEMENT_NAME: SourceFile = {
  name: 'is-valid-custom-element-name.ts',
  lang: 'ts',
  code: `import { isValidCustomElementName } from '@xaendar/common';

isValidCustomElementName('user-card');    // true
isValidCustomElementName('x-1');          // true
isValidCustomElementName('my.card_v2-x'); // true: digits, dots and underscores are allowed
isValidCustomElementName('card');         // false: no hyphen
isValidCustomElementName('User-card');    // false: an uppercase letter
isValidCustomElementName('font-face');    // false: a reserved name
isValidCustomElementName('my-élément');   // true: most non-ASCII characters are accepted
isValidCustomElementName('my-card!');     // false: an ASCII symbol
isValidCustomElementName('card', false);  // false, without logging`
};

/**
 * The snippet `keys.ts`, shown by the API reference of common.
 */
export const KEYS: SourceFile = {
  name: 'keys.ts',
  lang: 'ts',
  code: `import { keys } from '@xaendar/common';

/**
 * The height of each panel, in pixels.
 */
const heights = { header: 64, content: 480, footer: 48 };

Object.keys(heights); // ['header', 'content', 'footer'], typed string[]
keys(heights);        // ['header', 'content', 'footer'], typed ('header' | 'content' | 'footer')[]
keys({ 1: 'one' });   // ['1'], typed '1'[]: Object.keys always returns strings
keys(undefined);      // undefined

/**
 * The names of the panels.
 */
const panels = keys(heights);
/**
 * The height of the page.
 */
let total = 0;
for (let i = 0; i < panels.length; i++) {
  total += heights[panels[i]]; // a key of heights: no cast needed
}`
};

/**
 * The snippet `matches-custom-element-pattern.ts`, shown by the API reference of common.
 */
export const MATCHES_CUSTOM_ELEMENT_PATTERN: SourceFile = {
  name: 'matches-custom-element-pattern.ts',
  lang: 'ts',
  code: `import { matchesCustomElementPattern } from '@xaendar/common';

/**
 * The tags of other libraries, as declared in customElements of xaendar.json.
 */
const patterns = ['sl-*', 'vanilla-stars'];

matchesCustomElementPattern('sl-button', patterns);       // true
matchesCustomElementPattern('sl-icon-button', patterns);  // true: * matches hyphens too
matchesCustomElementPattern('vanilla-stars', patterns);   // true
matchesCustomElementPattern('vanilla-stars-2', patterns); // false: a pattern matches the whole name
matchesCustomElementPattern('xsl-button', patterns);      // false
matchesCustomElementPattern('sl-button', []);             // false: no patterns, no match`
};

/**
 * The snippet `remove-item.ts`, shown by the API reference of common.
 */
export const REMOVE_ITEM: SourceFile = {
  name: 'remove-item.ts',
  lang: 'ts',
  code: `import { removeItem } from '@xaendar/common';

/**
 * The ids of the selected rows.
 */
const selected = [3, 7, 9, 7];

removeItem(selected, 7); // true: selected is now [3, 9, 7], only the first 7 is removed
removeItem(selected, 4); // false: selected is left as it is`
};

/**
 * The snippet `slice.ts`, shown by the API reference of common.
 */
export const SLICE: SourceFile = {
  name: 'slice.ts',
  lang: 'ts',
  code: `import { slice } from '@xaendar/common';

slice('Hello world', 0, 5);  // 'Hello'
slice('Hello world', 6);     // 'world'
slice('Hello world', -5);    // 'world'
slice('Hello world', 0, -6); // 'Hello'

/**
 * The source of a template, possibly long.
 */
const source = '<user-card name="Ada" />';
/**
 * The name of its first tag: a copy, which does not keep the source in memory.
 */
const tagName = slice(source, 1, source.indexOf(' ')); // 'user-card'`
};

/**
 * The snippet `stack.ts`, shown by the API reference of common.
 */
export const STACK: SourceFile = {
  name: 'stack.ts',
  lang: 'ts',
  code: `import { Stack } from '@xaendar/common';

/**
 * The tags opened and not closed yet, the innermost on top.
 */
const openTags = new Stack<string>();

openTags.push('ul');           // 1, the new length
openTags.push('li');           // 2
openTags[0];                   // 'ul': indexes count from the bottom
openTags[openTags.length - 1]; // 'li': the top
openTags.values.join(' > ');   // 'ul > li': a copy, from the bottom
openTags.pop();                // 'li'
openTags.pop();                // 'ul'
openTags.pop();                // undefined: the stack is empty`
};

/**
 * The snippet `to-kebab-case.ts`, shown by the API reference of common.
 */
export const TO_KEBAB_CASE: SourceFile = {
  name: 'to-kebab-case.ts',
  lang: 'ts',
  code: `import { toKebabCase } from '@xaendar/common';

toKebabCase('UserCard');  // 'user-card'
toKebabCase('userCard');  // 'user-card'
toKebabCase('user_card'); // 'user-card'
toKebabCase('parseXML');  // 'parse-xml'
toKebabCase('XMLParser'); // 'xmlparser': a run of capitals is not split`
};

/**
 * The snippet `to-pascal-case.ts`, shown by the API reference of common.
 */
export const TO_PASCAL_CASE: SourceFile = {
  name: 'to-pascal-case.ts',
  lang: 'ts',
  code: `import { toPascalCase } from '@xaendar/common';

toPascalCase('user-card');   // 'UserCard'
toPascalCase('user_card');   // 'UserCard'
toPascalCase('userCard');    // 'UserCard'
toPascalCase('user.card');   // 'UserCard'
toPascalCase('x-ui-button'); // 'XUiButton'
toPascalCase('USER-CARD');   // 'USERCARD': the other letters keep their case`
};

/**
 * The snippet `values.ts`, shown by the API reference of common.
 */
export const VALUES: SourceFile = {
  name: 'values.ts',
  lang: 'ts',
  code: `import { values } from '@xaendar/common';

/**
 * The unread messages, by folder.
 */
const unread = { inbox: 3, archive: 0, spam: 12 };

values(unread);                                        // [3, 0, 12], typed number[]
values(unread).reduce((sum, count) => sum + count, 0); // 15
values(undefined);                                     // undefined`
};

/**
 * The snippet `escape-text.ts`, shown by the API reference of common.
 */
export const ESCAPE_TEXT: SourceFile = {
  name: 'escape-text.ts',
  lang: 'ts',
  code: `import { escapeText } from '@xaendar/common';

escapeText('Tom & Jerry <3'); // 'Tom &amp; Jerry &lt;3'
escapeText('"Hi", I said');   // '"Hi", I said': a quote ends nothing in a text`
};

/**
 * The snippet `escape-attribute.ts`, shown by the API reference of common.
 */
export const ESCAPE_ATTRIBUTE: SourceFile = {
  name: 'escape-attribute.ts',
  lang: 'ts',
  code: `import { escapeAttribute } from '@xaendar/common';

/**
 * The title of the link, typed by the user.
 */
const title = 'Say "hi" & <wave>';

\`<a title="\${escapeAttribute(title)}">\`; // '<a title="Say &quot;hi&quot; &amp; &lt;wave&gt;">'`
};

/**
 * The snippet `escape-raw-text.ts`, shown by the API reference of common.
 */
export const ESCAPE_RAW_TEXT: SourceFile = {
  name: 'escape-raw-text.ts',
  lang: 'ts',
  code: `import { escapeRawText } from '@xaendar/common';

escapeRawText('a > b { color: red }', 'style'); // unchanged: the parser decodes nothing in a stylesheet
escapeRawText('x = "</STYLE>"', 'style');        // 'x = "<\\/STYLE>"': no longer ends the element`
};

/**
 * The snippet `is-void-element.ts`, shown by the API reference of common.
 */
export const IS_VOID_ELEMENT: SourceFile = {
  name: 'is-void-element.ts',
  lang: 'ts',
  code: `import { isVoidElement } from '@xaendar/common';

isVoidElement('input'); // true: <input> has no end tag
isVoidElement('div');   // false`
};

/**
 * The snippet `is-raw-text-element.ts`, shown by the API reference of common.
 */
export const IS_RAW_TEXT_ELEMENT: SourceFile = {
  name: 'is-raw-text-element.ts',
  lang: 'ts',
  code: `import { isRawTextElement } from '@xaendar/common';

isRawTextElement('script');   // true
isRawTextElement('textarea'); // false: the parser decodes its character references`
};

/**
 * The snippet `drops-leading-newline.ts`, shown by the API reference of common.
 */
export const DROPS_LEADING_NEWLINE: SourceFile = {
  name: 'drops-leading-newline.ts',
  lang: 'ts',
  code: `import { dropsLeadingNewline } from '@xaendar/common';

/**
 * Writes the start tag of an element, and the line feed the parser drops after it when it drops one.
 *
 * @param tagName - The tag name of the element.
 * @returns The start tag.
 */
function writeStartTag(tagName: string): string {
  return dropsLeadingNewline(tagName) ? \`<\${tagName}>\\n\` : \`<\${tagName}>\`;
}

writeStartTag('pre'); // '<pre>\\n': a content starting with a line feed keeps it`
};
