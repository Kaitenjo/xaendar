import type { LayoutAtom, LayoutAttribute, LayoutBlock, LayoutBranch, LayoutConditionalBinding, LayoutDirective, LayoutElement, LayoutEvent, LayoutItem, LayoutLet, LayoutRender, LayoutVariable } from '../../types/template-layout/template-layout.type';
import { findClosing, findOutside } from '../balanced-text/balanced-text.utils';

/**
 * The elements whose content is kept as written: its spaces and line breaks are part of what is rendered.
 */
const RAW_ELEMENTS: ReadonlySet<string> = new Set(['pre', 'textarea', 'script', 'style']);

/**
 * The elements that have no content nor closing tag when they are not self-closed.
 */
const VOID_ELEMENTS: ReadonlySet<string> = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/**
 * The name of an element, a directive, an attribute: what is written up to a space, a quote or a character of the syntax.
 */
const NAME = /[^\s=<>/(){}"'@*]+/y;

/**
 * The name of an element.
 */
const TAG_NAME = /[^\s/>(]+/y;

/**
 * What the layout of a template is read from, and where it is read at.
 */
type Reader = {
  /**
   * The text of the template.
   */
  readonly source: string;
  /**
   * The index of the next character to read.
   */
  position: number;
};

/**
 * Thrown when a template is not written in a form its layout can be read from.
 */
class TemplateLayoutError extends Error { }

/**
 * Reads the layout of a template from its text: the elements, the control-flow blocks, the text and interpolations, the
 * comments, with the spaces and line breaks around them as written, so that it can be written again in another layout.
 *
 * Only the syntax that decides the layout is read: the expressions, the values of the attributes and the content of
 * `<pre>`, `<textarea>`, `<script>` and `<style>` are kept as written. The text is not checked: a template that cannot be
 * compiled can be read as long as its tags and blocks are closed.
 *
 * @param source - The text of the template, with `\n` line breaks.
 * @returns The content of the template, `undefined` if its layout cannot be read (a tag or a block that is not closed, a
 *   closing tag that doesn't match, a character that is not valid in the text).
 */
export function parseTemplateLayout(source: string): LayoutAtom[] | undefined {
  try {
    return readContent({ source, position: 0 }, 'document');
  } catch {
    return undefined;
  }
}

/**
 * Stops the reading of a template whose layout cannot be read.
 *
 * @param message - What is wrong, for the errors thrown while developing.
 * @throws Always.
 */
function fail(message: string): never {
  throw new TemplateLayoutError(message);
}

/**
 * Skips the spaces and line breaks.
 *
 * @param reader - The reader.
 */
function skipWhitespace(reader: Reader): void {
  while (reader.position < reader.source.length && /\s/.test(reader.source[reader.position])) {
    reader.position++;
  }
}

/**
 * Reads a name at the position of the reader.
 *
 * @param reader - The reader.
 * @param pattern - What a name looks like, a sticky pattern.
 * @returns The name.
 * @throws If there is no name at the position.
 */
function readName(reader: Reader, pattern: RegExp): string {
  pattern.lastIndex = reader.position;
  const match = pattern.exec(reader.source);
  if (!match) {
    return fail('A name is expected');
  }

  reader.position += match[0].length;
  return match[0];
}

/**
 * Reads the content of an element, of a block or of the template, up to what closes it.
 *
 * @param reader - The reader, at the start of the content.
 * @param stop - What closes the content: the end of the template, a closing tag or the `}` of a block. The closing tag
 *   and the `}` are not read.
 * @returns The atoms of the content.
 * @throws If the content is not closed, or what closes it is not where it is expected.
 */
function readContent(reader: Reader, stop: 'document' | 'tag' | 'block'): LayoutAtom[] {
  const { source } = reader;
  const atoms = new Array<LayoutAtom>();
  let text = '';
  let closed = false;

  while (!closed && reader.position < source.length) {
    const char = source[reader.position];
    if (char === '<' || char === '{' || char === '@' || char === '}') {
      if (text) {
        atoms.push({ kind: 'text', value: text });
        text = '';
      }

      closed = closesContent(reader, stop);
      if (!closed) {
        atoms.push(readAtom(reader));
      }
    } else {
      text += char;
      reader.position++;
    }
  }

  if (text) {
    atoms.push({ kind: 'text', value: text });
  }

  if (stop !== 'document' && !closed) {
    fail('The content is not closed');
  }

  return atoms;
}

/**
 * Tells whether what is at the position of the reader closes the content being read.
 *
 * @param reader - The reader, on a `<`, a `{`, an `@` or a `}`.
 * @param stop - What closes the content.
 * @returns `true` for the `}` closing a block or the closing tag of an element, `false` for what starts an atom.
 * @throws If a `}` or a closing tag is not what closes the content.
 */
function closesContent(reader: Reader, stop: 'document' | 'tag' | 'block'): boolean {
  const { source, position } = reader;
  if (source[position] === '}') {
    return stop === 'block' || fail('A } closes no block');
  }

  if (source.startsWith('</', position)) {
    return stop === 'tag' || fail('A closing tag closes no element');
  }

  return false;
}

/**
 * Reads what starts at the position of the reader: a comment, an element, an interpolation, a block, the render of a
 * template or a `@let`.
 *
 * @param reader - The reader, on a `<`, a `{` or an `@`.
 * @returns The atom.
 * @throws If what starts there is not valid.
 */
function readAtom(reader: Reader): LayoutAtom {
  const { source, position } = reader;
  switch (source[position]) {
    case '{': {
      const end = findClosing(source, position);
      if (end === undefined) {
        return fail('An interpolation is not closed');
      }

      reader.position = end + 1;
      return { kind: 'interpolation', expression: source.slice(position + 1, end) };
    }

    case '@':
      if (source.startsWith('@render', position)) {
        return readRender(reader);
      }

      return source.startsWith('@let', position) ? readLet(reader) : readBlock(reader, readContentBody);

    default:
      return source.startsWith('<!--', position) ? readComment(reader) : readElement(reader);
  }
}

/**
 * Reads the render of a template.
 *
 * @param reader - The reader, on the `@` of `@render`.
 * @returns The render.
 * @throws If the name of the template is not followed by its arguments between parentheses, or they are not closed.
 */
function readRender(reader: Reader): LayoutRender {
  reader.position += '@render'.length;
  skipWhitespace(reader);
  const callee = readName(reader, NAME);
  const { source, position } = reader;
  const end = source[position] === '(' ? findClosing(source, position) : undefined;
  if (end === undefined) {
    return fail('@render needs the arguments of the template between parentheses');
  }

  reader.position = end + 1;
  return { kind: 'render', callee, args: source.slice(position + 1, end) };
}

/**
 * Reads a `@let`.
 *
 * @param reader - The reader, on the `@` of `@let`.
 * @returns The `@let`.
 * @throws If the name is not followed by `=`, or the value is not ended by a `;`.
 */
function readLet(reader: Reader): LayoutLet {
  reader.position += '@let'.length;
  skipWhitespace(reader);
  const name = readName(reader, NAME);
  skipWhitespace(reader);
  const { source, position } = reader;
  const end = source[position] === '=' ? findOutside(source, position + 1, ';') : undefined;
  if (end === undefined) {
    return fail('@let needs its value between = and ;');
  }

  reader.position = end + 1;
  return { kind: 'let', name, value: source.slice(position + 1, end) };
}

/**
 * Reads a comment.
 *
 * @param reader - The reader, on the `<!--`.
 * @returns The comment.
 * @throws If the comment is not closed.
 */
function readComment(reader: Reader): LayoutAtom {
  const end = reader.source.indexOf('-->', reader.position);
  if (end === -1) {
    return fail('A comment is not closed');
  }

  const value = reader.source.slice(reader.position, end + 3);
  reader.position = end + 3;
  return { kind: 'comment', value };
}

/**
 * Reads an element, with its type arguments if it has them, and its content.
 *
 * @param reader - The reader, on the `<`.
 * @returns The element.
 * @throws If the element is not closed, or closed by another one, or its type arguments are not closed.
 */
function readElement(reader: Reader): LayoutElement {
  const { source } = reader;
  reader.position++;
  const name = readName(reader, TAG_NAME);
  let typeArguments: string | undefined;
  if (source[reader.position] === '(') {
    const end = findClosing(source, reader.position);
    if (end === undefined) {
      return fail('The type arguments of an element are not closed');
    }

    typeArguments = source.slice(reader.position + 1, end);
    reader.position = end + 1;
  }

  const items = readItems(reader, 'tag');
  const selfClosing = source.startsWith('/>', reader.position);
  reader.position += selfClosing ? 2 : 1;

  const element: { -readonly [Key in keyof LayoutElement]: LayoutElement[Key] } = { kind: 'element', name, items, selfClosing };
  if (typeArguments !== undefined) {
    element.typeArguments = typeArguments;
  }

  if (selfClosing || VOID_ELEMENTS.has(name)) {
    return element;
  }

  if (RAW_ELEMENTS.has(name)) {
    const end = source.indexOf(`</${name}`, reader.position);
    if (end === -1) {
      return fail(`<${name}> is not closed`);
    }

    element.raw = source.slice(reader.position, end);
    reader.position = end;
  } else {
    element.children = readContent(reader, 'tag');
  }

  reader.position += 2;
  if (readName(reader, TAG_NAME) !== name) {
    fail(`<${name}> is closed by another element`);
  }

  skipWhitespace(reader);
  if (source[reader.position] !== '>') {
    fail('A closing tag is not closed');
  }

  reader.position++;
  return element;
}

/**
 * Reads the content of a block of a template, up to its `}`, which is not read.
 *
 * @param reader - The reader, after the `{`.
 * @returns The atoms of the content.
 */
function readContentBody(reader: Reader): LayoutAtom[] {
  return readContent(reader, 'block');
}

/**
 * Reads the items of an opening tag, of the parentheses of a directive or of the braces of a conditional binding.
 *
 * @param reader - The reader, after what opens the items.
 * @param end - What closes them: the `>` or `/>` of the tag, a `)` or a `}`. It is not read.
 * @returns The items.
 * @throws If the items are not closed, or one of them is not valid.
 */
function readItems(reader: Reader, end: 'tag' | 'paren' | 'brace'): LayoutItem[] {
  const { source } = reader;
  const items = new Array<LayoutItem>();

  for (;;) {
    skipWhitespace(reader);
    const char = source[reader.position];
    if (char === undefined) {
      return fail('The items are not closed');
    }

    if (end === 'tag' ? char === '>' || source.startsWith('/>', reader.position) : char === (end === 'paren' ? ')' : '}')) {
      return items;
    }

    items.push(readItem(reader));
  }
}

/**
 * Reads an item: a template variable, a directive, a conditional binding, an event or an attribute.
 *
 * @param reader - The reader, at the start of the item.
 * @returns The item.
 * @throws If the item is not valid.
 */
function readItem(reader: Reader): LayoutItem {
  const { source, position } = reader;
  if (source[position] === '#') {
    return readVariable(reader);
  }

  if (source.startsWith('@@', position) || source[position] === '*') {
    return readDirective(reader);
  }

  if (source[position] === '@') {
    const block = readBlock(reader, readItemsBody);
    if (block.keyword === 'for') {
      fail('A conditional binding cannot be a @for');
    }

    return block as LayoutConditionalBinding;
  }

  return source[position] === '(' ? readEvent(reader) : readAttribute(reader);
}

/**
 * Reads the items of a conditional binding, up to its `}`, which is not read.
 *
 * @param reader - The reader, after the `{`.
 * @returns The items.
 */
function readItemsBody(reader: Reader): LayoutItem[] {
  return readItems(reader, 'brace');
}

/**
 * Reads the quoted value of an attribute or event.
 *
 * @param reader - The reader, after the `=`.
 * @returns The value as written between the quotes.
 * @throws If the value is not quoted, or the quote is not closed.
 */
function readValue(reader: Reader): string {
  const quote = reader.source[reader.position];
  const end = quote === '"' || quote === '\'' ? reader.source.indexOf(quote, reader.position + 1) : -1;
  if (end === -1) {
    return fail('A value is not quoted');
  }

  const value = reader.source.slice(reader.position + 1, end);
  reader.position = end + 1;
  return value;
}

/**
 * Reads an attribute, with its value if it has one.
 *
 * @param reader - The reader, at the start of the name.
 * @returns The attribute.
 */
function readAttribute(reader: Reader): LayoutAttribute {
  const name = readName(reader, NAME);
  if (reader.source[reader.position] !== '=') {
    return { kind: 'attribute', name };
  }

  reader.position++;
  return { kind: 'attribute', name, value: readValue(reader) };
}

/**
 * Reads an event binding.
 *
 * @param reader - The reader, on the `(`.
 * @returns The event.
 * @throws If the event is not followed by its quoted handler.
 */
function readEvent(reader: Reader): LayoutEvent {
  const end = reader.source.indexOf(')', reader.position);
  if (end === -1 || reader.source[end + 1] !== '=') {
    return fail('An event is not followed by its handler');
  }

  const name = reader.source.slice(reader.position + 1, end);
  reader.position = end + 2;
  return { kind: 'event', name, value: readValue(reader) };
}

/**
 * Reads a template variable, with the parameters of the template it declares if it has them.
 *
 * @param reader - The reader, on the `#`.
 * @returns The variable.
 * @throws If its parameters are not closed.
 */
function readVariable(reader: Reader): LayoutVariable {
  const { source } = reader;
  reader.position++;
  const variable: { -readonly [Key in keyof LayoutVariable]: LayoutVariable[Key] } = { kind: 'variable', name: readName(reader, NAME) };

  if (source[reader.position] === '(') {
    const end = findClosing(source, reader.position);
    if (end === undefined) {
      return fail('The parameters of a template are not closed');
    }

    variable.parameters = source.slice(reader.position + 1, end);
    reader.position = end + 1;
  }

  return variable;
}

/**
 * Reads a directive or a structural directive, with its type arguments and bindings if it has them.
 *
 * @param reader - The reader, on the `@@` or the `*`.
 * @returns The directive.
 * @throws If its type arguments or its bindings are not closed.
 */
function readDirective(reader: Reader): LayoutDirective {
  const { source } = reader;
  const prefix = source.startsWith('@@', reader.position) ? '@@' : '*';
  reader.position += prefix.length;
  const directive: { -readonly [Key in keyof LayoutDirective]: LayoutDirective[Key] } = { kind: 'directive', prefix, name: readName(reader, NAME) };

  if (source[reader.position] === '<') {
    const end = findClosing(source, reader.position);
    if (end === undefined) {
      return fail('The type arguments of a directive are not closed');
    }

    directive.typeArguments = source.slice(reader.position + 1, end);
    reader.position = end + 1;
  }

  if (source[reader.position] === '(') {
    reader.position++;
    directive.items = readItems(reader, 'paren');
    reader.position++;
  }

  return directive;
}

/**
 * Reads a control-flow block: an `@if` with its `@else if` and `@else` branches, a `@for`, or a `@switch` with its cases.
 *
 * @param reader - The reader, on the `@` opening the block.
 * @param readBody - Reads what the braces of a branch hold, up to the `}`, which is left to the caller of the function.
 * @returns The block.
 * @throws If the keyword is not one of a block, or a branch is not valid.
 */
function readBlock<Body>(reader: Reader, readBody: (reader: Reader) => Body): LayoutBlock<Body> {
  reader.position++;
  const keyword = readName(reader, NAME);
  if (keyword !== 'if' && keyword !== 'for' && keyword !== 'switch') {
    return fail(`@${keyword} does not open a block`);
  }

  if (keyword === 'switch') {
    return readSwitch(reader, readBody);
  }

  const branches = [readBranch(reader, keyword, readBody)];
  while (keyword === 'if') {
    const afterBlock = reader.position;
    skipWhitespace(reader);
    if (!reader.source.startsWith('@else', reader.position)) {
      reader.position = afterBlock;
      break;
    }

    reader.position++;
    if (readName(reader, NAME) !== 'else') {
      fail('Only an @else follows an @if');
    }

    skipWhitespace(reader);
    const isElseIf = reader.source.startsWith('if', reader.position);
    reader.position += isElseIf ? 2 : 0;
    branches.push(readBranch(reader, isElseIf ? 'else if' : 'else', readBody));
  }

  return { kind: 'block', keyword, branches };
}

/**
 * Reads a `@switch` block, after its keyword.
 *
 * @param reader - The reader, after `@switch`.
 * @param readBody - Reads what the braces of a case hold.
 * @returns The block.
 * @throws If the expression is not between parentheses, or something other than a case is in the braces.
 */
function readSwitch<Body>(reader: Reader, readBody: (reader: Reader) => Body): LayoutBlock<Body> {
  skipWhitespace(reader);
  const expression = readCondition(reader);
  skipWhitespace(reader);
  expectBrace(reader, '{');

  const branches = new Array<LayoutBranch<Body>>();
  for (;;) {
    skipWhitespace(reader);
    if (reader.source[reader.position] === '}') {
      reader.position++;
      return { kind: 'block', keyword: 'switch', expression, branches };
    }

    if (reader.source[reader.position] !== '@') {
      fail('Only cases are expected in a @switch');
    }

    reader.position++;
    const keyword = readName(reader, NAME);
    if (keyword !== 'case' && keyword !== 'default') {
      fail(`@${keyword} is not a case`);
    }

    branches.push(readBranch(reader, keyword, readBody, keyword === 'case'));
  }
}

/**
 * Reads a branch of a block, after its keyword: its condition if it has one, and its braces.
 *
 * @param reader - The reader, after the keyword of the branch.
 * @param keyword - The keyword of the branch.
 * @param readBody - Reads what the braces hold.
 * @param stackable - Whether the branch may have no braces, when another branch follows it (a `@case`).
 * @returns The branch.
 * @throws If the condition or the braces are missing or not closed.
 */
function readBranch<Body>(reader: Reader, keyword: string, readBody: (reader: Reader) => Body, stackable = false): LayoutBranch<Body> {
  skipWhitespace(reader);
  const branch: { -readonly [Key in keyof LayoutBranch<Body>]: LayoutBranch<Body>[Key] } = { keyword };
  if (reader.source[reader.position] === '(') {
    branch.condition = readCondition(reader);
    skipWhitespace(reader);
  } else if (keyword !== 'else' && keyword !== 'default') {
    fail(`@${keyword} needs a condition`);
  }

  if (stackable && reader.source[reader.position] === '@') {
    return branch;
  }

  expectBrace(reader, '{');
  branch.body = readBody(reader);
  expectBrace(reader, '}');
  return branch;
}

/**
 * Reads the condition of a branch, between parentheses.
 *
 * @param reader - The reader, on the `(`.
 * @returns The condition as written between the parentheses, without the spaces around it.
 * @throws If the condition is not between parentheses, or is not closed.
 */
function readCondition(reader: Reader): string {
  if (reader.source[reader.position] !== '(') {
    return fail('A condition is expected between parentheses');
  }

  const end = findClosing(reader.source, reader.position);
  if (end === undefined) {
    return fail('A condition is not closed');
  }

  const condition = reader.source.slice(reader.position + 1, end).trim();
  reader.position = end + 1;
  return condition;
}

/**
 * Reads a brace.
 *
 * @param reader - The reader.
 * @param brace - The brace expected.
 * @throws If the brace is not at the position of the reader.
 */
function expectBrace(reader: Reader, brace: '{' | '}'): void {
  if (reader.source[reader.position] !== brace) {
    fail(`A ${brace} is expected`);
  }

  reader.position++;
}
