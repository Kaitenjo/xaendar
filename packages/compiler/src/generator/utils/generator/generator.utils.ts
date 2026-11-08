import { slice } from '@xaendar/common';
import { Dictionary } from '@xaendar/types';
import globals from 'globals';
import { Expression, forEachChild, Identifier, isAsExpression, isCallExpression, isIdentifier, isNonNullExpression, isPropertyAccessExpression, isPropertyAssignment, isShorthandPropertyAssignment, isTypeNode, Node } from 'typescript';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import type { LineMapping } from '../../../type-checker/types/line-mapping.type';
import type { ElementNamespace } from '../../../types/element-namespace.type';
import type { Span } from '../../../types/span.type';
import type { CompilerContext } from '../../../models/compiler-context/compiler-context.model';
import type { EmittedNode } from '../../types/emitted-node.type';
import { forEachExpressionChild } from '../../../utils/expression-children/expression-children.utils';
import { ResolveExpressionOptions } from '../../types/resolve-expresion-options.type';

/**
 * Complete set of JavaScript global identifiers up to ES2026.
 *
 * These are identifiers that TypeScript's parser classifies as
 * `SyntaxKind.Identifier` (unlike true keywords such as `typeof`,
 * `instanceof`, `true`, `false`, `null` which have their own SyntaxKind)
 * but that must never be prefixed with `this.` inside a template expression
 * because they refer to well-known globals, not to component properties.
 *
 * Organised by ECMAScript category, mirroring the MDN "Standard built-in
 * objects" reference, plus the ES2026 additions (Temporal, DisposableStack,
 * AsyncDisposableStack, SuppressedError, Math.sumPrecise surface).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
 */
export const GLOBAL_IDENTIFIERS = new Set([
  ...Object.keys(globals.browser),
  ...Object.keys(globals.builtin),
  ...Object.getOwnPropertyNames(Object.prototype),
]);

/**
 * The global identifiers of the browser that ECMAScript does not define (`window`, `document`, `localStorage`…): the
 * ones read through the object given as `browserGlobals` (see `ResolveExpressionOptions`).
 */
const BROWSER_GLOBAL_IDENTIFIERS: ReadonlySet<string> = new Set(Object.keys(globals.browser).filter(name => !Object.hasOwn(globals.builtin, name)));

/**
 * The globals Node declares too, whose content is the one of the browser of the user only in the browser: the storages
 * and the agent.
 */
const USER_AGENT_GLOBALS: ReadonlySet<string> = new Set(['localStorage', 'sessionStorage', 'navigator']);

export const ROOT_NODE = 'root';

/**
 * Tells whether a name is a global only the browser has, one the server reads as `undefined`, or that does not hold
 * what the browser holds: not a global of ECMAScript, nor one Node has too (`console`, `fetch`, `URL`).
 *
 * @param name - The name.
 * @returns `true` when the name is such a global.
 */
export function isBrowserOnlyGlobal(name: string): boolean {
  return BROWSER_GLOBAL_IDENTIFIERS.has(name) && (!Object.hasOwn(globals.node, name) || USER_AGENT_GLOBALS.has(name));
}

/**
 * Resolves references to component properties inside a template expression.
 *
 * Identifiers that are not found in the active scope chain and are not
 * well-known globals are prefixed with `this.` so they resolve against
 * the component instance at runtime. Identifiers found in the scope chain
 * are resolved either as a bare local reference (if declared directly in
 * the current generated function's own scope) or via a runtime
 * `parentContext.get(...)` traversal (if inherited from an enclosing
 * scope) — and a trailing `()` is appended in either case if the
 * identifier was declared as a signal, so the generated code always
 * correctly unwraps it.
 *
 * The original formatting of the expression — parentheses, spacing,
 * operator tokens, member access dots — is preserved verbatim by delegating
 * to `node.getText()` for any subtree that contains no resolvable identifiers.
 *
 * When a `segments` collector is given, it is filled with the mappings from the columns of the
 * resolved expression to the spans of the template they come from: one for every resolved identifier
 * (its name, e.g. `foo` in `root.foo`) and one for every piece copied verbatim. Only the expressions
 * validated together with their offset in the template (see `validateExpression`) produce mappings.
 * The resolved expression is the same whether the collector is given or not.
 *
 * @param expression - Either a raw identifier string or a validated
 *   `Expression` node produced by `validateExpression`.
 * @param generatorContext - The active template scope context.
 * @param options - The options of the resolution.
 * @param segments - Optional collector of the mappings of the resolved expression, whose columns are relative to its start.
 * @returns The resolved expression as a JavaScript string ready for codegen.
 *
 * @example
 * // Simple identifier
 * resolveExpression('items', context) // → 'this.items'
 *
 * @example
 * // Signal identifier inherited from an ancestor scope (e.g. `$index` in a
 * // nested @for body)
 * resolveExpression('$index', context) // → "parentContext.get('$index')()"
 *
 * @example
 * // Complex expression — formatting preserved
 * resolveExpression(node, context)
 * // typeof id !== 'boolean' || pippo instanceof HTMLElement
 * // → typeof this.id !== 'boolean' || this.pippo instanceof HTMLElement
 */
export function resolveExpression(expression: Expression, generatorContext: CompilerContext, options?: ResolveExpressionOptions, segments?: LineMapping[]): { expression: string, reactive?: boolean } {
  const { segments: emittedSegments, ...resolved } = emitNode(expression, expression, generatorContext, mapDefaultOptions(options));

  /*
    An expression starting with an object literal is wrapped in parentheses: where the generated code
    uses it as the body of an arrow function or as a statement, its brace would open a block instead
  */
  const wrapped = resolved.expression.startsWith('{');
  segments?.push(...shiftSegments(emittedSegments, wrapped ? 1 : 0));
  return wrapped ? { ...resolved, expression: `(${resolved.expression})` } : resolved;
}

/**
 * Moves segments to the right, e.g. those of a child node once its text follows the text emitted before it.
 *
 * @param segments - The segments to move.
 * @param columns - The number of columns to move them by.
 * @returns The moved segments.
 */
function shiftSegments(segments: LineMapping[], columns: number): LineMapping[] {
  return segments.map(({ columnStart, columnEnd, original }) => ({ columnStart: columnStart + columns, columnEnd: columnEnd + columns, original }));
}

/**
 * Maps the end of a text emitted at the start of the output onto the span of the template it comes from.
 *
 * @param text - The emitted text.
 * @param span - The span of the template, if known.
 * @param columnStart - The column of the output the mapped part of the text starts at.
 * @returns The mapping, or no mapping when the span is not known or the text is empty.
 */
function segmentOf(text: string, span: Span | undefined, columnStart = 0): LineMapping[] {
  return span && text.length ? [{ columnStart, columnEnd: text.length, original: span }] : [];
}

/**
 * Emits the resolved text for a node.
 *
 * - If the node has no resolvable identifiers in its subtree, emits
 *   `node.getText()` verbatim — preserving all original spacing,
 *   parentheses, dots, and punctuation.
 * - If the node is a resolvable Identifier, emits the resolved access
 *   expression.
 * - Otherwise recurses into children and concatenates their output.
 */

function emitNode(node: Node, parent: Node, generatorContext: CompilerContext, options: Required<ResolveExpressionOptions>): EmittedNode {
  /*
    A signal an `@if` narrows is read through the constant holding its value, which TypeScript narrows: the call is kept
    before it, so that the features of the editor still find the signal (`(root.item(), __if12_item)`)
  */
  const callee = getSignalCallee(node);
  const narrowed = callee && needsResolution(callee, node, generatorContext, options) ? options.narrowedSignal(callee.text) : undefined;
  const emitted = emitResolvedNode(node, parent, generatorContext, options);
  if (!narrowed) {
    return emitted;
  }

  const expression = `(${emitted.expression}, ${narrowed})`;
  const segments = shiftSegments(emitted.segments, 1);
  const span = getTemplateSpan(node);
  // The whole read is mapped onto the call, e.g. for an error on the value narrowed, the identifier keeps its own mapping
  if (span) {
    segments.push({ columnStart: 0, columnEnd: expression.length, original: span });
  }

  return { ...emitted, expression, segments };
}

/**
 * Returns the identifier a call without arguments calls, as an expression reads a signal (`item()`).
 *
 * @param node - The node of the expression.
 * @returns The called identifier, `undefined` if the node is not such a call.
 */
export function getSignalCallee(node: Node): Identifier | undefined {
  return isCallExpression(node) && isIdentifier(node.expression) && !node.arguments.length && !node.questionDotToken ? node.expression : undefined;
}

/**
 * Emits the resolved text for a node, as {@link emitNode} does for a node that is not the call of a narrowed signal.
 *
 * @param node - The node to emit.
 * @param parent - The parent of the node.
 * @param generatorContext - The active template scope context.
 * @param options - The options of the resolution.
 * @returns The emitted text, with its mappings.
 */
function emitResolvedNode(node: Node, parent: Node, generatorContext: CompilerContext, options: Required<ResolveExpressionOptions>): EmittedNode {
  const span = getTemplateSpan(node);

  // Leaf Identifier that needs resolution
  if (isIdentifier(node) && needsResolution(node, parent, generatorContext, options)) {
    const text = node.text;
    const resolved = resolveIdentifier(text, generatorContext, options);

    // A shorthand property ({ name }) keeps its name, and takes the resolved value
    const expression = isShorthandPropertyAssignment(parent) && resolved.expression !== text ? `${text}: ${resolved.expression}` : resolved.expression;
    // The name of the identifier ends the resolved access (`root.name`), unless it is read through the context
    const segments = segmentOf(expression, span, expression.endsWith(text) ? expression.length - text.length : 0);
    return { ...resolved, expression, segments };
  }

  /*
    The non-null assertion (`value!`) and the cast (`value as Date`) are TypeScript only: unless kept for the type-check
    code, they are dropped and the value they apply to is emitted
  */
  if (!options.preserveTypeScript && (isNonNullExpression(node) || isAsExpression(node))) {
    return emitNode(node.expression, node, generatorContext, options);
  }

  // No resolvable identifiers nor TypeScript syntax to drop in this subtree — emit verbatim
  if (!containsResolvableIdentifier(node, parent, generatorContext, options) && (options.preserveTypeScript || !containsTypeScriptSyntax(node))) {
    const expression = node.getText();
    return { expression, segments: segmentOf(expression, span) };
  }

  /*
    Has resolvable identifiers — recurse into children and concatenate.
    We use the original source positions to reconstruct spacing between
    children faithfully instead of joining with a fixed separator.
  */
  const sourceText = node.getSourceFile().text;
  // Offset turning a position of the source file of the expression into an offset of the template
  const templateDelta = span && span.start - node.getStart();
  const result: EmittedNode = { expression: '', segments: [] };
  let lastEnd = node.getStart();

  // The type of a cast, kept for the type-check code, is written as is: its names are types, not members
  forEachChild(node, child => {
    appendEmitted(result, sourceText, templateDelta, lastEnd, child.getStart(), isTypeNode(child) ? emitVerbatim(child) : emitNode(child, node, generatorContext, options));
    lastEnd = child.getEnd();
  });

  // Append any trailing text after the last child (e.g. closing paren)
  appendEmitted(result, sourceText, templateDelta, lastEnd, node.getEnd());
  return result;
}

/**
 * Appends to the text emitted for a node the text copied verbatim from the source file between `start` and `end` (e.g.
 * the spacing and the punctuation between its children), followed by the text emitted for a child, if any.
 *
 * @param result - The text emitted for the node so far, with its mapping.
 * @param sourceText - The text of the source file of the expression.
 * @param templateDelta - The offset turning a position of the source file into an offset of the template, `undefined`
 *   when the expression is not mapped onto the template.
 * @param start - Where the verbatim text starts in the source file.
 * @param end - Where the verbatim text ends in the source file.
 * @param child - The text emitted for the child following it, if any.
 */
function appendEmitted(result: EmittedNode, sourceText: string, templateDelta: number | undefined, start: number, end: number, child?: EmittedNode): void {
  const verbatim = slice(sourceText, start, end);
  const verbatimSpan = templateDelta === undefined ? undefined : { start: templateDelta + start, end: templateDelta + end };
  const column = result.expression.length;
  result.segments.push(...shiftSegments(segmentOf(verbatim, verbatimSpan), column));
  if (child) {
    result.segments.push(...shiftSegments(child.segments, column + verbatim.length));
  }

  result.expression = `${result.expression}${verbatim}${child?.expression ?? ''}`;
  result.reactive = result.reactive || child?.reactive;
}

/**
 * Emits the text of a node as written, mapped onto its span in the template.
 *
 * @param node - The node.
 * @returns The text of the node, with its mapping.
 */
function emitVerbatim(node: Node): EmittedNode {
  const expression = node.getText();
  return { expression, segments: segmentOf(expression, getTemplateSpan(node)) };
}

/**
 * Resolves an identifier of an expression: to an identifier left as written, a variable of the template scope,
 * a signal member or another member, both reached through the resolver, or a name the template imports.
 * The variables of the template shadow the members and the imported names, as the type-check code reads them.
 *
 * @param text - The name of the identifier.
 * @param generatorContext - Current render scope context.
 * @param options - The options of the resolution.
 * @returns The resolved access expression, and whether it reads a signal.
 */
function resolveIdentifier(text: string, generatorContext: CompilerContext, options: Required<ResolveExpressionOptions>): { expression: string, reactive?: boolean } {
  if (generatorContext.hasUnresolvableIdentifier(text)) {
    return { expression: text, reactive: generatorContext.getUnresolvableIdentifierKind(text) === 'signal' };
  }

  if (generatorContext.hasIdentifier(text)) {
    const kind = generatorContext.getIdentifierKind(text);
    return { expression: `context.get('${text}')`, reactive: kind === 'signal' };
  }

  const member = options.resolver ? `${options.resolver}.${text}` : text;
  if (generatorContext.hasSignalField(text)) {
    return { expression: member, reactive: true };
  }

  const imported = generatorContext.getImportedIdentifier(text);
  if (imported) {
    imported.used = true;
    return { expression: imported.expression, reactive: imported.kind === 'signal' };
  }

  // A global of the browser reaches here only when it is read through `browserGlobals`, unless a member shadows it
  if (BROWSER_GLOBAL_IDENTIFIERS.has(text) && !generatorContext.hasShadowingMember(text)) {
    return { expression: `${options.browserGlobals}.${text}` };
  }

  return { expression: member };
}

/**
 * Returns true if the subtree rooted at `node` contains at least one
 * Identifier that needs context resolution.
 *
 * Short-circuits as soon as one is found to avoid visiting the whole tree. The type of a cast is left out: its names are
 * types.
 *
 * @param node - The root of the subtree.
 * @param parent - The parent of the root.
 * @param generatorContext - The active template scope context.
 * @param options - The options of the resolution.
 * @returns Whether the subtree contains an identifier to resolve.
 */
function containsResolvableIdentifier(node: Node, parent: Node, generatorContext: CompilerContext, options: Required<ResolveExpressionOptions>): boolean {
  if (isIdentifier(node) && needsResolution(node, parent, generatorContext, options)) {
    return true;
  }

  return forEachExpressionChild(node, child => containsResolvableIdentifier(child, node, generatorContext, options)) ?? false;
}

/**
 * Returns true if the subtree rooted at `node` contains a non-null assertion (`value!`) or a cast (`value as Date`),
 * which are dropped from the emitted text.
 *
 * @param node - The root of the subtree.
 * @returns Whether the subtree contains a non-null assertion or a cast.
 */
function containsTypeScriptSyntax(node: Node): boolean {
  return isNonNullExpression(node) || isAsExpression(node) || (forEachChild(node, containsTypeScriptSyntax) ?? false);
}

/**
 * Returns true if the identifier needs to be resolved against the context
 * or prefixed with `this.` — i.e. it is not the property-name side of a member
 * access expression, and it is not a global/builtin identifier. A local identifier
 * (class member, inherited ones included, or element ref) named like a global
 * shadows it, and so does a name the template imports: the global stays reachable as `window.name` or `globalThis.name`.
 * A global of the browser is resolved too when the options read it through `browserGlobals`.
 *
 * @param node - The identifier.
 * @param parent - The parent of the identifier.
 * @param generatorContext - The active template scope context.
 * @param options - The options of the resolution.
 * @returns Whether the identifier is resolved.
 */
function needsResolution(node: Identifier, parent: Node, generatorContext: CompilerContext, options: Required<ResolveExpressionOptions>): boolean {
  const { text } = node;
  const isLocal = generatorContext.hasSignalField(text)
    || generatorContext.hasShadowingMember(text)
    || generatorContext.hasUnresolvableIdentifier(text)
    || generatorContext.hasIdentifier(text)
    || !!generatorContext.getImportedIdentifier(text);
  const isBrowserGlobal = !!options.browserGlobals && BROWSER_GLOBAL_IDENTIFIERS.has(text);

  return !(
    (isPropertyAccessExpression(parent) && parent.name === node)  // obj.prop -> prop should not be resolved
    || (isPropertyAssignment(parent) && parent.name === node) // { key: value } -> key should not be resolved
    || (GLOBAL_IDENTIFIERS.has(text) && !isLocal && !isBrowserGlobal) // a local identifier shadows the global one
    || !text
  );
}

/**
 * Generates a unique variable name for a DOM element based on its tag name
 * and parent node context.
 *
 * When the parent is the root node (`this._root`), the identifier is based
 * solely on the tag name; otherwise the parent name is prepended to ensure
 * uniqueness within nested structures. Hyphens in tag names are replaced
 * with underscores to produce a valid JavaScript identifier.
 *
 * @param node - The `ElementNode` for which to generate the identifier.
 * @param parentNode - The variable name of the parent node.
 * @param index - A numeric suffix to disambiguate sibling elements of the same type.
 * @returns A unique variable name string for the element.
 */
export function getElementIdentifier(node: ElementNode, parentNode: string, index: string): string {
  return getIdentifier(node.tagName, parentNode, index);
}

/**
 * Generates a unique variable name for a text or interpolation node.
 *
 * @param prefix - Optional prefix to use instead of the default `'text'`.
 * @param parentNode - The variable name of the parent node.
 * @param index - A numeric suffix to disambiguate sibling text nodes.
 * @returns A unique variable name string for the text node.
 */
export function getTextIdentifier(prefix = 'text', parentNode: string, index: string): string {
  return getIdentifier(prefix, parentNode, index);
}

/**
 * Generates a unique variable name for a control-flow block (if, else-if, else,
 * for, switch, case, or default).
 *
 * @param prefix - The block type prefix (`'if'`, `'elseIf'`, `'else'`, etc.).
 * @param parentNode - The variable name of the parent node.
 * @param index - A suffix to disambiguate sibling blocks.
 * @returns A unique variable name string for the block.
 */
export function getBlockIdentifier(prefix: 'if' | 'elseIf' | 'else' | 'for' | 'switch' | 'case' | 'default' | 'hydrate' | 'client' | 'placeholder' | 'try' | 'catch' | 'defer' | 'loading' | 'error', parentNode: string, index: string): string {
  return getIdentifier(prefix, parentNode, index);
}

/**
 * Returns the runtime factory creating the elements of a namespace, assigned to `createElement` of a runtime context.
 *
 * @param namespace - The namespace.
 * @returns The name of the factory: `_createElement`, `_createSVGElement` or `_createMATHMLElement`.
 */
export function getElementFactory(namespace: ElementNamespace): string {
  switch (namespace) {
    case 'svg':
      return '_createSVGElement';
    case 'mathml':
      return '_createMATHMLElement';
    default:
      return '_createElement';
  }
}

/**
 * Turns a text of the template (a text node, a static attribute value) into a
 * single-quoted string literal for the generated code, escaping the characters that would end
 * the literal or change its value: backslashes, single quotes and line terminators.
 *
 * @param value - The text to turn into a string literal.
 * @returns The single-quoted string literal evaluating to `value`.
 */
export function toStringLiteral(value: string): string {
  const STRING_LITERAL_ESCAPES: Readonly<Dictionary<string, string>> = {
    '\\': '\\\\',
    '\'': '\\\'',
    '\n': '\\n',
    '\r': '\\r'
  };
  return `'${value.replace(/[\\'\n\r\p{Zl}\p{Zp}]/gu, char => STRING_LITERAL_ESCAPES[char] ?? `\\u${char.charCodeAt(0).toString(16)}`)}'`;
}

function getIdentifier(prefix: string, parentNode: string, index: string): string {
  const identifier = parentNode !== ROOT_NODE ? `${parentNode}__${prefix}${index}` : `${prefix}${index}`;
  return identifier.replace(/-/g, '_');
}

function mapDefaultOptions(options?: ResolveExpressionOptions): Required<ResolveExpressionOptions> {
  return {
    resolver: options?.resolver ?? 'this',
    preserveTypeScript: options?.preserveTypeScript ?? false,
    narrowedSignal: options?.narrowedSignal ?? (() => undefined),
    browserGlobals: options?.browserGlobals ?? ''
  };
}