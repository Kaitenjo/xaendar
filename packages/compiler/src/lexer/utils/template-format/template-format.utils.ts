import type { LayoutAtom, LayoutBlock, LayoutBranch, LayoutElement, LayoutItem } from '../../types/template-layout/template-layout.type';
import type { TemplateFormatOptions } from '../../types/template-format-options/template-format-options.type';
import { findClosing } from '../balanced-text/balanced-text.utils';
import { formatImportHeader } from '../import-organization/import-organization.utils';
import { parseTemplateLayout } from '../template-layout/template-layout.utils';

/**
 * The rows a content is written in, as it is built.
 */
type ContentLayout = {
  /**
   * The rows, without their indentation. The first one follows what opens the content, unless {@link leadingBreak}.
   */
  readonly rows: string[];
  /**
   * Whether the content starts on a new line, after what opens it.
   */
  readonly leadingBreak: boolean;
  /**
   * Whether what closes the content is on a new line.
   */
  readonly trailingBreak: boolean;
  /**
   * Whether a line break can be written between what opens the content and the content, without changing the template.
   */
  readonly canBreakStart: boolean;
  /**
   * Whether a line break can be written between the content and what closes it, without changing the template.
   */
  readonly canBreakEnd: boolean;
};

/**
 * The rows of a content, as they are written.
 */
class RowBuilder {
  /**
   * The rows that are complete.
   */
  public readonly rows = new Array<string>();
  /**
   * The row being written.
   */
  public current = '';

  /**
   * Adds text to the row being written.
   *
   * @param text - The text.
   */
  public append(text: string): void {
    this.current = `${this.current}${text}`;
  }

  /**
   * Completes the row being written and starts another one, with a blank row before it if asked. Nothing is done at the
   * start of the content: what follows what opens it starts a row anyway.
   *
   * @param blank - Whether to leave a blank row.
   */
  public breakRow(blank: boolean): void {
    if (this.rows.length || this.current) {
      this.rows.push(this.current);
      if (blank) {
        this.rows.push('');
      }

      this.current = '';
    }
  }

  /**
   * Returns every row, the last one included.
   *
   * @returns The rows.
   */
  public finish(): string[] {
    this.rows.push(this.current);
    return this.rows;
  }
}

/**
 * Formats a template: indents its elements and control-flow blocks, writes the opening tags that don't fit the line one
 * item per line, writes the interpolations of the properties as `{expression}` and those of the text as
 * `{ expression }`, a space after the keyword of a block (`@if (condition) {`), and its `@import` statements in a regular form.
 *
 * Only whitespace is changed: what the template renders is not. A space between two inline nodes written on one line is
 * kept, no whitespace is added around a text, the text, the expressions, the values of the attributes, the comments and the
 * content of `<pre>`, `<textarea>`, `<script>` and `<style>` are kept as written, except that the lines of a text are
 * indented again.
 *
 * @param source - The text of the template.
 * @param options - How to format it.
 * @returns The formatted template, `undefined` if its layout cannot be read (e.g. a tag that is not closed), so that
 *   it is left as the user wrote it.
 */
export function formatTemplate(source: string, options: TemplateFormatOptions): string | undefined {
  const text = source.replace(/\r\n?/g, '\n');
  const header = formatImportHeader(text);
  if (header && text.slice(0, header.start).trim()) {
    return undefined;
  }

  const atoms = parseTemplateLayout(text.slice(header ? header.end : 0));
  if (!atoms) {
    return undefined;
  }

  const rows = printContent(atoms, 0, 0, options, true).rows;
  const body = joinRows(rows, 0, options).trim();
  const first = atoms[0];
  // A blank line is kept between the header and the template
  const gap = first?.kind === 'text' && !/\S/.test(first.value) && countLineBreaks(first.value) > 1 ? '\n\n' : '\n';
  const formatted = header ? `${header.text}${body ? `${gap}${body}` : ''}\n` : (body ? `${body}\n` : '');
  return source.includes('\r\n') ? formatted.replace(/\n/g, '\r\n') : formatted;
}

/**
 * Counts the line breaks of a text.
 *
 * @param text - The text.
 * @returns The number of line breaks.
 */
function countLineBreaks(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    count += text[i] === '\n' ? 1 : 0;
  }

  return count;
}

/**
 * Writes the indentation of a level.
 *
 * @param level - The level.
 * @param options - How to format the template.
 * @returns The indentation.
 */
function pad(level: number, options: TemplateFormatOptions): string {
  return options.indent.repeat(level);
}

/**
 * Joins the rows of a content, indenting every row but the first and leaving the blank ones empty.
 *
 * @param rows - The rows.
 * @param level - The level the rows are indented at.
 * @param options - How to format the template.
 * @returns The text of the rows.
 */
function joinRows(rows: readonly string[], level: number, options: TemplateFormatOptions): string {
  const indentation = pad(level, options);
  return rows.map((row, index) => (index && row ? `${indentation}${row}` : row)).join('\n');
}

/**
 * Tells whether a text holds nothing but spaces and line breaks.
 *
 * @param text - The text.
 * @returns `true` if the text is blank.
 */
function isBlank(text: string): boolean {
  return !/\S/.test(text);
}

/**
 * Tells whether an atom is a text made of nothing but whitespace.
 *
 * @param atom - The atom.
 * @returns `true` for a blank text.
 */
function isBlankText(atom: LayoutAtom): atom is Extract<LayoutAtom, { kind: 'text' }> {
  return atom.kind === 'text' && isBlank(atom.value);
}

/**
 * Tells whether an atom is a node that starts on a line of its own: an element or a block.
 *
 * @param atom - The atom, if any.
 * @returns `true` for an element and a block.
 */
function isStructure(atom: LayoutAtom | undefined): boolean {
  return atom?.kind === 'element' || atom?.kind === 'block';
}

/**
 * Tells whether a line break can be written between two atoms where there is none. Between an element or block and
 * another node, whitespace is never rendered: it is when there is text, so no line break is added next to it.
 *
 * @param previous - The atom before.
 * @param current - The atom after.
 * @returns `true` if the atoms are two nodes, at least one being an element or a block.
 */
function breaksBetween(previous: LayoutAtom, current: LayoutAtom): boolean {
  const isNode = (atom: LayoutAtom): boolean => atom.kind !== 'text' && atom.kind !== 'comment';
  return isNode(previous) && isNode(current) && (isStructure(previous) || isStructure(current));
}

/**
 * Tells whether the whitespace between two nodes is replaced by a line break: an element or block that follows another node
 * (or starts the content) is on a line of its own, so the space written before it goes, unlike the one before an
 * interpolation, which is kept. Whitespace at an end of the content goes too. Nothing is moved next to a comment, whose
 * position among the nodes is part of what the user wrote. A text is never separated from the element that follows it.
 *
 * @param previous - The atom before, if any.
 * @param next - The atom after, if any.
 * @returns `true` if the whitespace is replaced by a line break.
 */
function isDropped(previous: LayoutAtom | undefined, next: LayoutAtom | undefined): boolean {
  return previous?.kind !== 'comment' && next?.kind !== 'comment' && (!previous || !next || isStructure(next));
}

/**
 * Writes the interpolation of a property: its expression between braces, without spaces around it.
 *
 * @param value - The value of the attribute, as written between the quotes.
 * @returns The value, with the spaces around the expression removed if the value is an interpolation.
 */
function formatPropertyValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('{') && findClosing(trimmed, 0) === trimmed.length - 1 ? `{${trimmed.slice(1, -1).trim()}}` : value;
}

/**
 * Writes a quoted value, with the quote that doesn't appear in it.
 *
 * @param value - The value.
 * @returns The value between quotes.
 */
function quote(value: string): string {
  return value.includes('"') ? `'${value}'` : `"${value}"`;
}

/**
 * Tells whether an item is written on several lines: a conditional binding, or a directive holding one.
 *
 * @param item - The item.
 * @returns `true` for an item written on several lines.
 */
function isMultiline(item: LayoutItem): boolean {
  return item.kind === 'block' || (item.kind === 'directive' && !!item.items?.some(isMultiline));
}

/**
 * Writes an item of an opening tag or of the parentheses of a directive.
 *
 * @param item - The item.
 * @param level - The level the item is written at, which the lines after its first one are indented at.
 * @param options - How to format the template.
 * @returns The text of the item, whose first line is not indented.
 */
function printItem(item: LayoutItem, level: number, options: TemplateFormatOptions): string {
  switch (item.kind) {
    case 'attribute':
      return item.value === undefined ? item.name : `${item.name}=${quote(formatPropertyValue(item.value))}`;

    case 'event':
      return `(${item.name})=${quote(item.value)}`;

    case 'directive': {
      const typeArguments = item.typeArguments === undefined ? '' : `<${item.typeArguments.trim()}>`;
      return `${item.prefix}${item.name}${typeArguments}${item.items ? `(${printItems(item.items, level, options, ')')}` : ''}`;
    }

    default:
      return printBlock(item, level, options, (items, bodyLevel) => printItems(items, bodyLevel - 1, options, '}'));
  }
}

/**
 * Writes the items between the parentheses of a directive or the braces of a conditional binding, up to what closes
 * them: on one line, or one per line when one of them is written on several.
 *
 * @param items - The items.
 * @param level - The level the group is written at.
 * @param options - How to format the template.
 * @param closer - What closes the group, written after the items.
 * @returns The text of the items and what closes them.
 */
function printItems(items: readonly LayoutItem[], level: number, options: TemplateFormatOptions, closer: ')' | '}'): string {
  if (closer === ')' && !items.some(isMultiline)) {
    return `${items.map(item => printItem(item, level, options)).join(' ')})`;
  }

  const rows = items.map(item => `\n${pad(level + 1, options)}${printItem(item, level + 1, options)}`).join('');
  return `${rows}\n${pad(level, options)}${closer}`;
}

/**
 * Writes the header of a branch of a block: `@if (condition)`, `@else`.
 *
 * @param branch - The branch.
 * @returns The header.
 */
function printBranchHeader<Body>(branch: LayoutBranch<Body>): string {
  return `@${branch.keyword}${branch.condition === undefined ? '' : ` (${branch.condition})`}`;
}

/**
 * Writes a control-flow block: its `{` after the header on the same line, its content indented, its `}` indented like
 * its keyword, the `@else` branches on the line of the `}` before them, the cases of a `@switch` one per line.
 *
 * @param block - The block.
 * @param level - The level the block is written at.
 * @param options - How to format the template.
 * @param printBody - Writes what the braces of a branch hold, up to its `}`, given the level of its content.
 * @returns The text of the block, whose first line is not indented.
 */
function printBlock<Body>(block: LayoutBlock<Body>, level: number, options: TemplateFormatOptions, printBody: (body: Body, bodyLevel: number) => string): string {
  const printBranch = (branch: LayoutBranch<Body>, branchLevel: number): string => (branch.body === undefined
    ? printBranchHeader(branch)
    : `${printBranchHeader(branch)} {${printBody(branch.body, branchLevel + 1)}`);

  if (block.keyword === 'switch') {
    const cases = block.branches.map(branch => `\n${pad(level + 1, options)}${printBranch(branch, level + 1)}`).join('');
    return `@switch (${block.expression}) {${cases}\n${pad(level, options)}}`;
  }

  return block.branches.map(branch => printBranch(branch, level)).join(' ');
}

/**
 * Writes the content of a block: indented, between line breaks, up to the `}`.
 *
 * @param atoms - The content.
 * @param level - The level of the content.
 * @param options - How to format the template.
 * @returns The text between the `{` and the `}`, the `}` included.
 */
function printBlockBody(atoms: readonly LayoutAtom[], level: number, options: TemplateFormatOptions): string {
  if (atoms.every(isBlankText)) {
    return `\n${pad(level - 1, options)}}`;
  }

  const layout = printContent(atoms, level, level * options.indentWidth, options, true);
  return `${layout.leadingBreak ? `\n${pad(level, options)}` : ''}${joinRows(layout.rows, level, options)}${layout.trailingBreak ? `\n${pad(level - 1, options)}` : ''}}`;
}

/**
 * Writes the opening tag of an element:
 * - on one line if it fits the width and has no conditional binding;
 * - otherwise, if it has no conditional binding, the items fill the lines up to the width, the next ones indented one
 *   level deeper, with the `>` or `/>` at the end of the last line;
 * - with a conditional binding, one item per line, with the `>` or `/>` on a line of its own.
 *
 * @param element - The element.
 * @param level - The level of the element.
 * @param column - The column the tag starts at.
 * @param options - How to format the template.
 * @returns The text of the tag, whether it is written on several lines, and the column its last line ends at.
 */
function printOpeningTag(element: LayoutElement, level: number, column: number, options: TemplateFormatOptions): { text: string, multiline: boolean, endColumn: number } {
  const items = element.items.map(item => printItem(item, level + 1, options));
  const closer = element.selfClosing ? ' />' : '>';
  const flat = `<${element.name}${items.map(item => ` ${item}`).join('')}${closer}`;
  const hasConditionalBinding = element.items.some(isMultiline);
  if (!element.items.length || (!hasConditionalBinding && column + flat.length <= options.printWidth)) {
    return { text: flat, multiline: false, endColumn: column + flat.length };
  }

  if (hasConditionalBinding) {
    const rows = items.map(item => `\n${pad(level + 1, options)}${item}`).join('');
    return { text: `<${element.name}${rows}\n${pad(level, options)}${element.selfClosing ? '/>' : '>'}`, multiline: true, endColumn: options.indentWidth * level + 1 };
  }

  const rows = [`<${element.name}`];
  let width = column + rows[0].length;
  for (let i = 0; i < items.length; i++) {
    const reserved = i === items.length - 1 ? closer.length : 0;
    if (width + 1 + items[i].length + reserved <= options.printWidth) {
      rows[rows.length - 1] = `${rows[rows.length - 1]} ${items[i]}`;
      width += 1 + items[i].length;
    } else {
      rows.push(`${pad(level + 1, options)}${items[i]}`);
      width = options.indentWidth * (level + 1) + items[i].length;
    }
  }

  rows[rows.length - 1] = `${rows[rows.length - 1]}${closer}`;
  return { text: rows.join('\n'), multiline: true, endColumn: width + closer.length };
}

/**
 * Writes an element, with its content.
 *
 * @param element - The element.
 * @param level - The level of the element.
 * @param column - The column the element starts at.
 * @param options - How to format the template.
 * @returns The text of the element, whose first line is not indented.
 */
function printElement(element: LayoutElement, level: number, column: number, options: TemplateFormatOptions): string {
  const opening = printOpeningTag(element, level, column, options);
  const closing = `</${element.name}>`;
  if (element.raw !== undefined) {
    return `${opening.text}${element.raw}${closing}`;
  }

  const children = element.children;
  if (!children) {
    return opening.text;
  }

  if (children.every(isBlankText)) {
    const whitespace = children.map(child => child.value).join('');
    return `${opening.text}${whitespace.includes('\n') ? `\n${pad(level, options)}` : whitespace}${closing}`;
  }

  const openingEnd = opening.endColumn;
  const layout = printContent(children, level + 1, openingEnd, options, false);
  let { rows, leadingBreak, trailingBreak } = layout;

  // A content that doesn't fit the line, or follows a tag written on several lines, goes on lines of its own if that changes nothing
  const isSingleLine = !leadingBreak && !trailingBreak && rows.length === 1 && !rows[0].includes('\n');
  if (isSingleLine && layout.canBreakStart && layout.canBreakEnd && (opening.multiline || openingEnd + rows[0].length + closing.length > options.printWidth)) {
    rows = [rows[0].trim()];
    leadingBreak = true;
    trailingBreak = true;
  }

  return `${opening.text}${leadingBreak ? `\n${pad(level + 1, options)}` : ''}${joinRows(rows, level + 1, options)}${trailingBreak ? `\n${pad(level, options)}` : ''}${closing}`;
}

/**
 * Tells whether the content starts on a new line after what opens it, or ends on a new line before what closes it.
 *
 * @param atom - The first atom of the content, or the last one.
 * @param stack - Whether the content holds elements or blocks, which are written one per line.
 * @param edge - Which end of the content the atom is at.
 * @returns `true` if the content breaks there.
 */
function breaksAtEdge(atom: LayoutAtom | undefined, stack: boolean, edge: 'start' | 'end'): boolean {
  switch (atom?.kind) {
    case undefined:
    case 'comment':
      return false;

    case 'text':
      return isBlank(atom.value) ? stack || atom.value.includes('\n') : (edge === 'start' ? /^\s*/ : /\s*$/).exec(atom.value)![0].includes('\n');

    default:
      return stack;
  }
}

/**
 * Tells whether a line break can be written at an end of a content without changing what is rendered: there is
 * only whitespace or an interpolation there.
 *
 * @param atom - The first atom of the content, or the last one.
 * @param edge - Which end of the content the atom is at.
 * @returns `true` if a line break can be written there.
 */
function canBreakAtEdge(atom: LayoutAtom | undefined, edge: 'start' | 'end'): boolean {
  if (atom?.kind === 'interpolation') {
    return true;
  }

  return atom?.kind === 'text' && (isBlank(atom.value) || (edge === 'start' ? /^\s/ : /\s$/).test(atom.value));
}

/**
 * Writes the content of an element, of a block or of the template in rows.
 *
 * Between two nodes, a line break is written where there is no space rendered: a text is never separated from what is
 * next to it. The lines of a text are indented again, and its blank lines kept up to one.
 *
 * @param atoms - The content.
 * @param level - The level of the content.
 * @param firstColumn - The column the first row starts at, when the content doesn't start on a new line.
 * @param options - How to format the template.
 * @param forceStack - Whether to write the content as if it held elements: every node on its own line.
 * @returns The rows and how they are laid out.
 */
function printContent(atoms: readonly LayoutAtom[], level: number, firstColumn: number, options: TemplateFormatOptions, forceStack: boolean): ContentLayout {
  const stack = forceStack || atoms.some(atom => atom.kind === 'element' || atom.kind === 'block');
  const leadingBreak = breaksAtEdge(atoms[0], stack, 'start');
  const trailingBreak = breaksAtEdge(atoms[atoms.length - 1], stack, 'end');
  const builder = new RowBuilder();
  const last = atoms.length - 1;

  const column = (): number => {
    const lineBreak = builder.current.lastIndexOf('\n');
    if (lineBreak !== -1) {
      return builder.current.length - lineBreak - 1;
    }

    return (builder.rows.length || leadingBreak ? level * options.indentWidth : firstColumn) + builder.current.length;
  };

  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i];
    if (i && stack && breaksBetween(atoms[i - 1], atom)) {
      builder.breakRow(false);
    }

    switch (atom.kind) {
      case 'text':
        printText(atom.value, { builder, isFirst: i === 0, isLast: i === last, breakable: stack && isDropped(atoms[i - 1], atoms[i + 1]) });
        break;

      case 'interpolation':
        builder.append(atom.expression.trim() ? `{ ${atom.expression.trim()} }` : `{${atom.expression}}`);
        break;

      case 'comment':
        builder.append(atom.value);
        break;

      case 'element':
        builder.append(printElement(atom, level, column(), options));
        break;

      default:
        builder.append(printBlock(atom, level, options, (body, bodyLevel) => printBlockBody(body, bodyLevel, options)));
    }
  }

  return { rows: builder.finish(), leadingBreak, trailingBreak, canBreakStart: canBreakAtEdge(atoms[0], 'start'), canBreakEnd: canBreakAtEdge(atoms[last], 'end') };
}

/**
 * Writes a text in the rows of its content: its lines indented again, no whitespace added around it.
 *
 * @param value - The text as written.
 * @param context - Where the text is written, and whether it is at an end of its content or between two nodes where a line
 *   break can replace its whitespace (when it is blank).
 */
function printText(value: string, context: { builder: RowBuilder, isFirst: boolean, isLast: boolean, breakable: boolean }): void {
  const { builder, isFirst, isLast, breakable } = context;
  if (isBlank(value)) {
    const lineBreaks = countLineBreaks(value);
    if (lineBreaks) {
      // The line break after the last atom, or before the first one, is written by the element or block
      if (!isLast) {
        builder.breakRow(lineBreaks > 1);
      }
    } else if (breakable) {
      if (!isFirst && !isLast) {
        builder.breakRow(false);
      }
    } else {
      builder.append(value);
    }

    return;
  }

  const leading = /^\s*/.exec(value)![0];
  const trailing = /\s*$/.exec(value)![0];
  const lines = value.slice(leading.length, value.length - trailing.length).split('\n');

  if (countLineBreaks(leading)) {
    builder.breakRow(countLineBreaks(leading) > 1);
  } else {
    builder.append(leading);
  }

  builder.append(lines[0].trimEnd());
  let blank = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      builder.breakRow(blank);
      builder.append(line);
      blank = false;
    } else {
      blank = true;
    }
  }

  if (countLineBreaks(trailing)) {
    if (!isLast) {
      builder.breakRow(countLineBreaks(trailing) > 1);
    }
  } else {
    builder.append(trailing);
  }
}
