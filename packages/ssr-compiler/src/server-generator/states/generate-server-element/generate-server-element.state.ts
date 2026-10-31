import { dropsLeadingNewline, escapeAttribute, indent, isValidCustomElementName, isVoidElement } from '@xaendar/common';
import { ASTNodeType, CompilerContext, getChildrenNamespace, getElementIdentifier, getElementNamespace, isStructuralElement, resolveExpression, toStringLiteral, type AttributeNode, type ClassBindingNode, type ConditionalBindingBranchNode, type ConditionalBindingNode, type ElementNode, type StructuralDirectiveNode } from '@xaendar/compiler';
import type { Function } from '@xaendar/types';
import type { ServerCodePiece } from '../../types/server-code-piece.type';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { GenerateChildren } from '../../types/generate-children.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS, toArrayLiteral, toStatements } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code writing an element: its start tag, its children and its end tag.
 *
 * A native element with only static and expression attributes, the most common case, is written as HTML, the values of
 * its expressions escaped when it is rendered. An element toggling classes or with conditional bindings writes its start
 * tag through `_ssrStartTag`, which applies the bindings as the client applies them, and a component through
 * `_ssrComponent`, which renders it. The children of the element are written in the same function, since they are not
 * a scope of their own, except for the content of an element a structural directive is applied to: that element is
 * written by the function `_ssrStructural` calls when every structural directive allows it, and its content by a function
 * of its own, named like the one of the client.
 *
 * The events and the custom directives are left out: the server writes HTML, the client listens and applies them.
 * An element ref is `undefined` on the server, initialized when the render reaches the element, as on the client.
 *
 * @param node - The element node.
 * @param parent - Where the element is rendered.
 * @param index - The position of the node among its siblings.
 * @param compilerContext - The compiler context of the node.
 * @param generateChildren - Generates the code of the children of the element, in the function being written.
 * @returns The code of the element, and the functions it calls.
 */
export function generateServerElement(node: ElementNode, parent: ServerParent, index: string, compilerContext: CompilerContext, generateChildren: GenerateChildren): ServerTransitionResult {
  const { tagName } = node;
  const id = getElementIdentifier(node, parent.id, index);
  const childrenNamespace = getChildrenNamespace(tagName, getElementNamespace(tagName, compilerContext.namespace));
  const childrenParent: ServerParent = { id, tag: tagName };
  if (!isStructuralElement(node)) {
    const childrenContext = childrenNamespace !== compilerContext.namespace ? new CompilerContext(compilerContext, childrenNamespace) : compilerContext;
    const children = generateChildren(node.children, childrenParent, childrenContext);
    return { pieces: writeElement(node, compilerContext, children.pieces), functionsToProcess: children.functionsToProcess };
  }

  const structuralDirectives = mapStructuralDirectives(node.structuralDirectives, compilerContext);
  const structuralConditionalBindings = mapConditionalBindingDescriptors(node.conditionalBindings, compilerContext, branch => !appliesStructuralDirectives(branch), (branch, condition) => mapStructuralBranch(branch, condition, compilerContext));
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  const children = new Array<ServerCodePiece>();
  if (node.children.length) {
    const key = `${id}Children`;
    functionsToProcess.set(key, { fn: { node, context: new CompilerContext(compilerContext, childrenNamespace), parent: childrenParent }, args: ['out', 'parentContext'] });
    children.push({ statement: `${key}.call(this, out, context);` });
  }

  const render = ['(out, context) => {', ...indent(toStatements(writeElement(node, compilerContext, children))), '}'];
  return {
    pieces: [{ statement: toCall('_ssrStructural', 'out, context', [toArrayLiteral(structuralDirectives), toArrayLiteral(structuralConditionalBindings), render]) }],
    functionsToProcess
  };
}

/**
 * Writes an element: its start tag, as HTML or through the runtime (see {@link generateServerElement}), a line feed for
 * an element whose leading one the parser drops, its children, and its end tag, unless it is a void element.
 *
 * @param node - The element node.
 * @param compilerContext - The compiler context of the node.
 * @param children - The code of the children.
 * @returns The code of the element.
 */
function writeElement(node: ElementNode, compilerContext: CompilerContext, children: readonly ServerCodePiece[]): ServerCodePiece[] {
  const { tagName, attributes, classBindings, ref } = node;
  const isHtml = getElementNamespace(tagName, compilerContext.namespace) === 'html';
  const isComponent = isValidCustomElementName(tagName, false) && !compilerContext.isForeignElement(tagName);
  const conditionalBindings = mapConditionalBindingDescriptors(node.conditionalBindings, compilerContext, isEmptyBranch, (branch, condition) => mapBranch(branch, condition, compilerContext));
  const pieces = new Array<ServerCodePiece>();
  if (ref) {
    pieces.push({ statement: `context.set('${ref.name}', undefined);` });
  }

  if (isComponent || classBindings.length || conditionalBindings.length) {
    const descriptors = mapAttributes(attributes, compilerContext);
    appendClassBindings(descriptors, classBindings, compilerContext);
    pieces.push({ statement: toCall(isComponent ? '_ssrComponent' : '_ssrStartTag', `out, context, '${tagName}'`, [toArrayLiteral(descriptors), toArrayLiteral(conditionalBindings)]) });
  } else {
    pieces.push({ html: `<${tagName}` });
    for (let i = 0; i < attributes.length; i++) {
      const { name, value } = attributes[i];
      typeof value === 'string'
        ? pieces.push({ html: ` ${name}="${escapeAttribute(value)}"` })
        : pieces.push({ html: ` ${name}="` }, { value: `_escapeAttribute(${resolve(value.expression, compilerContext)})` }, { html: '"' });
    }
    pieces.push({ html: '>' });
  }

  if (isHtml && dropsLeadingNewline(tagName)) {
    pieces.push({ html: '\n' });
  }

  for (let i = 0; i < children.length; i++) {
    pieces.push(children[i]);
  }

  if (!isHtml || !isVoidElement(tagName)) {
    pieces.push({ html: `</${tagName}>` });
  }

  return pieces;
}

/**
 * Maps attribute nodes to the descriptors the runtime applies, with the setters of the client reading the value once.
 *
 * @param attributes - The attribute nodes.
 * @param compilerContext - The compiler context of the attributes.
 * @returns The lines of the descriptors, one per attribute.
 */
function mapAttributes(attributes: AttributeNode[], compilerContext: CompilerContext): string[] {
  return attributes.map(({ name, value }) => typeof value === 'string'
    ? `{ name: ${toStringLiteral(name)}, value: ${toStringLiteral(value)}, setter: _setProperty },`
    : `{ name: ${toStringLiteral(name)}, value: () => ${resolve(value.expression, compilerContext)}, setter: _setExpressionProperty },`);
}

/**
 * Appends to the descriptors of the attributes the ones of the classes the element toggles, as the client does.
 *
 * @param descriptors - The lines of the descriptors of the attributes.
 * @param classBindings - The class binding nodes.
 * @param compilerContext - The compiler context of the class bindings.
 */
function appendClassBindings(descriptors: string[], classBindings: ClassBindingNode[], compilerContext: CompilerContext): void {
  for (let i = 0; i < classBindings.length; i++) {
    const { className, value } = classBindings[i];
    descriptors.push(`{ name: ${toStringLiteral(className)}, value: () => ${resolve(value.expression, compilerContext)}, setter: _setExpressionClass },`);
  }
}

/**
 * Maps conditional binding nodes to the descriptors the runtime selects the branch of: the branches, each one mapped by
 * `mapBranch`, and, for a `@switch`, the expression whose value selects the branch.
 *
 * @param conditionalBindings - The conditional binding nodes.
 * @param compilerContext - The compiler context of the conditional bindings.
 * @param isEmpty - Tells whether a branch has nothing to apply: a conditional binding whose branches all have nothing
 *   to apply is skipped.
 * @param mapBranch - Maps a branch, given the lines declaring its condition, to its descriptor.
 * @returns The lines of the descriptors, one per conditional binding.
 */
function mapConditionalBindingDescriptors(
  conditionalBindings: ConditionalBindingNode[],
  compilerContext: CompilerContext,
  isEmpty: Function<[branch: ConditionalBindingBranchNode], boolean>,
  mapBranch: Function<[branch: ConditionalBindingBranchNode, condition: string[]], string[]>
): string[] {
  const lines = new Array<string>();
  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    const { branches } = conditionalBinding;
    if (branches.every(isEmpty)) {
      continue;
    }

    const mappedBranches = new Array<string>();
    for (let j = 0; j < branches.length; j++) {
      mappedBranches.push(...mapBranch(branches[j], mapCondition(conditionalBinding, j, compilerContext)));
    }

    lines.push('{');
    if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
      lines.push(indent(`expression: () => ${resolve(conditionalBinding.expression, compilerContext)},`));
    }
    lines.push(...indent(['branches: [', ...indent(mappedBranches), ']']), '},');
  }

  return lines;
}

/**
 * Maps what selects a branch of a conditional binding, as the client does: the condition of an `@if` or `@else if`
 * branch, the values of the `@case`s of a `@switch` branch, written as declared, `null` for a `@default`, nothing for an
 * `@else`.
 *
 * @param conditionalBinding - The conditional binding node.
 * @param index - The position of the branch.
 * @param compilerContext - The compiler context of the conditional binding.
 * @returns The lines declaring the condition of the branch, if any.
 */
function mapCondition(conditionalBinding: ConditionalBindingNode, index: number, compilerContext: CompilerContext): string[] {
  if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
    const { condition } = conditionalBinding.branches[index];
    return [`condition: ${condition ? `[${condition.join(', ')}]` : 'null'},`];
  }

  const { condition } = conditionalBinding.branches[index];
  return condition ? [`condition: () => ${resolve(condition, compilerContext)},`] : [];
}

/**
 * Maps a branch of a conditional binding to the descriptor of the attributes and of the classes it applies, and of its
 * nested conditional bindings.
 *
 * @param branch - The branch node.
 * @param condition - The lines declaring the condition of the branch.
 * @param compilerContext - The compiler context of the branch.
 * @returns The lines of the descriptor.
 */
function mapBranch(branch: ConditionalBindingBranchNode, condition: string[], compilerContext: CompilerContext): string[] {
  const attributes = mapAttributes(branch.attributes, compilerContext);
  appendClassBindings(attributes, branch.classBindings, compilerContext);
  const conditionalBindings = mapConditionalBindingDescriptors(branch.conditionalBindings, compilerContext, isEmptyBranch, (nested, nestedCondition) => mapBranch(nested, nestedCondition, compilerContext));

  return ['{', ...indent(condition.concat(toProperty('attributes', attributes, ','), toProperty('conditionalBindings', conditionalBindings, ''))), '},'];
}

/**
 * Maps a branch of a conditional binding to the descriptor of the structural directives it applies, and of its nested
 * conditional bindings applying them.
 *
 * @param branch - The branch node.
 * @param condition - The lines declaring the condition of the branch.
 * @param compilerContext - The compiler context of the branch.
 * @returns The lines of the descriptor.
 */
function mapStructuralBranch(branch: ConditionalBindingBranchNode, condition: string[], compilerContext: CompilerContext): string[] {
  const structuralDirectives = mapStructuralDirectives(branch.structuralDirectives, compilerContext);
  const conditionalBindings = mapConditionalBindingDescriptors(branch.conditionalBindings, compilerContext, nested => !appliesStructuralDirectives(nested), (nested, nestedCondition) => mapStructuralBranch(nested, nestedCondition, compilerContext));

  return ['{', ...indent(condition.concat(toProperty('structuralDirectives', structuralDirectives, ','), toProperty('conditionalBindings', conditionalBindings, ''))), '},'];
}

/**
 * Maps structural directive nodes to the descriptors the runtime evaluates: the selector and the properties.
 *
 * @param structuralDirectives - The structural directive nodes.
 * @param compilerContext - The compiler context of the structural directives.
 * @returns The lines of the descriptors, one per structural directive.
 */
function mapStructuralDirectives(structuralDirectives: StructuralDirectiveNode[], compilerContext: CompilerContext): string[] {
  const lines = new Array<string>();
  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    lines.push('{', ...indent([`selector: ${toStringLiteral(selector)},`].concat(toProperty('attributes', mapAttributes(attributes, compilerContext), ''))), '},');
  }

  return lines;
}

/**
 * Tells whether a branch of a conditional binding writes nothing on the server: no attribute and no class, neither
 * directly nor through its nested conditional bindings. Its events and its directives are left out.
 *
 * @param branch - The branch node.
 * @returns `true` when the branch writes nothing.
 */
function isEmptyBranch({ attributes, classBindings, conditionalBindings }: ConditionalBindingBranchNode): boolean {
  return !attributes.length && !classBindings.length && conditionalBindings.every(({ branches }) => branches.every(isEmptyBranch));
}

/**
 * Tells whether a branch of a conditional binding applies a structural directive, directly or through its nested
 * conditional bindings.
 *
 * @param branch - The branch node.
 * @returns `true` when the branch applies a structural directive.
 */
function appliesStructuralDirectives({ structuralDirectives, conditionalBindings }: ConditionalBindingBranchNode): boolean {
  return !!structuralDirectives.length || conditionalBindings.some(({ branches }) => branches.some(appliesStructuralDirectives));
}

/**
 * Writes a property of a descriptor holding an array literal.
 *
 * @param name - The name of the property.
 * @param lines - The lines of the items.
 * @param separator - What follows the property.
 * @returns The lines of the property.
 */
function toProperty(name: string, lines: string[], separator: ',' | ''): string[] {
  const array = toArrayLiteral(lines);
  array[0] = `${name}: ${array[0]}`;
  array[array.length - 1] = `${array[array.length - 1]}${separator}`;
  return array;
}

/**
 * Writes the call of a runtime helper whose last arguments span several lines, each one following the previous one.
 *
 * @param callee - The name of the helper.
 * @param inlineArgs - The first arguments, written on the line of the call.
 * @param blockArgs - The lines of each one of the following arguments.
 * @returns The statement.
 */
function toCall(callee: string, inlineArgs: string, blockArgs: string[][]): string {
  const lines = [`${callee}(${inlineArgs}`];
  for (let i = 0; i < blockArgs.length; i++) {
    const arg = blockArgs[i];
    lines[lines.length - 1] = `${lines[lines.length - 1]}, ${arg[0]}`;
    for (let j = 1; j < arg.length; j++) {
      lines.push(arg[j]);
    }
  }

  lines[lines.length - 1] = `${lines[lines.length - 1]});`;
  return lines.join('\n');
}

/**
 * Resolves an expression of the element as the code rendering on the server reads it.
 *
 * @param expression - The expression.
 * @param compilerContext - The compiler context of the element.
 * @returns The resolved expression.
 */
function resolve(expression: Parameters<typeof resolveExpression>[0], compilerContext: CompilerContext): string {
  return resolveExpression(expression, compilerContext, SERVER_RESOLVE_OPTIONS).expression;
}
