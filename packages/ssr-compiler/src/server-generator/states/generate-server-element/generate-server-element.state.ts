import { dropsLeadingNewline, escapeAttribute, indent, isValidCustomElementName, isVoidElement } from '@xaendar/common';
import { ASTNodeType, GeneratorContext, getChildrenNamespace, getElementIdentifier, getElementNamespace, isStructuralElement, resolveExpression, toStringLiteral, type AttributeNode, type ClassBindingNode, type ComponentMetadata, type ConditionalBindingBranchNode, type ConditionalBindingNode, type DirectiveNode, type ElementNode, type StructuralDirectiveNode } from '@xaendar/compiler';
import type { Function } from '@xaendar/types';
import type { ServerCodePiece } from '../../types/server-code-piece.type';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { GenerateChildren } from '../../types/generate-children.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS, toArrayLiteral, toStatements } from '../../utils/server-code/server-code.utils';
import { SUBMIT_ATTRIBUTE } from '../../../costants/ssr-markers.constants';

/**
 * Generates the code writing an element: its start tag, its children and its end tag.
 *
 * A native element with only static and expression attributes, the most common case, is written as HTML, the values of
 * its expressions escaped when it is rendered. An element toggling classes, with conditional bindings or applying custom
 * directives writes its start tag through `_ssrStartTag`, which applies the bindings and the directives as the client
 * applies them, and a component through
 * `_ssrComponent`, which renders it, `_ssrIsland` for an interactive one a static template renders, or
 * `_ssrClientComponent` for one rendering only in the browser, whose class may not be there. The children of the element are written in the same function, since they are not
 * a scope of their own, except for the content of an element a structural directive is applied to: that element is
 * written by the function `_ssrStructural` calls when every structural directive allows it, and its content by a function
 * of its own, named like the one of the client.
 *
 * The events are left out: the server writes HTML, the client listens to them. The custom directives of a native
 * element, its own and the ones of its conditional bindings, are applied by `_ssrStartTag` without their events: their
 * `onInit` runs, their effects do not. The ones of a component are left out, the client applies them. The names of the
 * events are registered for the event contract of the page, and an element listening to `submit` is marked
 * by an attribute, the one thing the contract has to know of an element: it must prevent the submission before the
 * runtime is there.
 * An element ref is `undefined` on the server, initialized when the render reaches the element, as on the client.
 *
 * @param node - The element node.
 * @param parent - Where the element is rendered.
 * @param index - The position of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @param generateChildren - Generates the code of the children of the element, in the function being written.
 * @returns The code of the element, and the functions it calls.
 */
export function generateServerElement(node: ElementNode, parent: ServerParent, index: string, generatorContext: GeneratorContext, generateChildren: GenerateChildren): ServerTransitionResult {
  const { tagName } = node;
  const id = getElementIdentifier(node, parent.id, index);
  const childrenNamespace = getChildrenNamespace(tagName, getElementNamespace(tagName, generatorContext.namespace));
  const childrenParent: ServerParent = { id, tag: tagName };
  if (!isStructuralElement(node)) {
    const childrenContext = childrenNamespace !== generatorContext.namespace ? new GeneratorContext(generatorContext, childrenNamespace) : generatorContext;
    const children = generateChildren(node.children, childrenParent, childrenContext);
    return { pieces: writeElement(node, generatorContext, children.pieces), functionsToProcess: children.functionsToProcess };
  }

  const structuralDirectives = mapStructuralDirectives(node.structuralDirectives, generatorContext);
  const structuralConditionalBindings = mapConditionalBindingDescriptors(node.conditionalBindings, generatorContext, branch => !appliesStructuralDirectives(branch), (branch, condition) => mapStructuralBranch(branch, condition, generatorContext));
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  const children = new Array<ServerCodePiece>();
  if (node.children.length) {
    const key = `${id}Children`;
    functionsToProcess.set(key, { fn: { node, context: new GeneratorContext(generatorContext, childrenNamespace), parent: childrenParent }, args: ['out', 'parentContext'] });
    children.push({ statement: `${key}.call(this, out, context);` });
  }

  const render = ['(out, context) => {', ...indent(toStatements(writeElement(node, generatorContext, children))), '}'];
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
 * @param generatorContext - The generator context of the node.
 * @param children - The code of the children.
 * @returns The code of the element.
 */
function writeElement(node: ElementNode, generatorContext: GeneratorContext, children: readonly ServerCodePiece[]): ServerCodePiece[] {
  const { tagName, attributes, classBindings, ref } = node;
  const isHtml = getElementNamespace(tagName, generatorContext.namespace) === 'html';
  const isComponent = isValidCustomElementName(tagName, false) && !generatorContext.isForeignElement(tagName);
  // Only a native element applies its custom directives on the server
  const withDirectives = !isComponent;
  const conditionalBindings = mapConditionalBindingDescriptors(node.conditionalBindings, generatorContext, branch => isEmptyBranch(branch, withDirectives), (branch, condition) => mapBranch(branch, condition, isComponent ? tagName : undefined, generatorContext));
  const directives = withDirectives ? mapDirectives(node.directives, generatorContext) : undefined;
  const pieces = new Array<ServerCodePiece>();
  if (ref) {
    pieces.push({ statement: `context.set('${ref.name}', undefined);` });
  }

  registerEvents(node, generatorContext);

  if (isComponent || classBindings.length || conditionalBindings.length || directives?.length) {
    const descriptors = mapAttributes(attributes, generatorContext, isComponent ? tagName : undefined);
    appendSubmitMark(descriptors, node);
    appendClassBindings(descriptors, classBindings, generatorContext);
    const args = [toArrayLiteral(descriptors), toArrayLiteral(conditionalBindings)];
    const clientComponent = isComponent ? generatorContext.getClientComponent(tagName) : undefined;
    if (clientComponent) {
      args.push([toClientOptions(clientComponent, generatorContext)]);
    } else if (directives?.length) {
      args.push(toArrayLiteral(directives));
    }

    pieces.push({ statement: toCall(getStartTagWriter(tagName, isComponent, generatorContext), `out, context, '${tagName}'`, args) });
  } else {
    pieces.push({ html: `<${tagName}` });
    for (let i = 0; i < attributes.length; i++) {
      const { name, value } = attributes[i];
      typeof value === 'string'
        ? pieces.push({ html: ` ${name}="${escapeAttribute(value)}"` })
        : pieces.push({ html: ` ${name}="` }, { value: `_escapeAttribute(${resolve(value.expression, generatorContext)})` }, { html: '"' });
    }

    if (listensToSubmit(node)) {
      pieces.push({ html: ` ${SUBMIT_ATTRIBUTE}=""` });
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
 * Registers the events an element listens to, the ones of its conditional bindings included, whatever branch is selected.
 *
 * @param bindings - The element, or a branch of a conditional binding.
 * @param generatorContext - The generator context of the element.
 */
function registerEvents({ events, conditionalBindings }: Pick<ConditionalBindingBranchNode, 'events' | 'conditionalBindings'>, generatorContext: GeneratorContext): void {
  for (let i = 0; i < events.length; i++) {
    generatorContext.addEventName(events[i].name);
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      registerEvents(branches[j], generatorContext);
    }
  }
}

/**
 * Tells whether an element, or a branch of a conditional binding, listens to `submit`.
 *
 * @param bindings - The element or the branch.
 * @returns `true` when it does.
 */
function listensToSubmit({ events }: Pick<ConditionalBindingBranchNode, 'events'>): boolean {
  return events.some(({ name }) => name === 'submit');
}

/**
 * Appends to the descriptors of the attributes the mark of an element listening to `submit`: in a branch of a conditional
 * binding, the mark depends on the branch selected, as the listener does.
 *
 * @param descriptors - The lines of the descriptors of the attributes.
 * @param bindings - The element or the branch.
 */
function appendSubmitMark(descriptors: string[], bindings: Pick<ConditionalBindingBranchNode, 'events'>): void {
  if (listensToSubmit(bindings)) {
    descriptors.push(`{ name: '${SUBMIT_ATTRIBUTE}', value: '', setter: _setProperty },`);
  }
}

/**
 * Returns the runtime helper writing the start tag of an element.
 *
 * @param tagName - The tag name of the element.
 * @param isComponent - Whether the element is a component.
 * @param generatorContext - The generator context of the element.
 * @returns The name of the helper.
 */
function getStartTagWriter(tagName: string, isComponent: boolean, generatorContext: GeneratorContext): string {
  if (!isComponent) {
    return '_ssrStartTag';
  }

  if (generatorContext.getClientComponent(tagName)) {
    return '_ssrClientComponent';
  }

  return generatorContext.isIsland(tagName) ? '_ssrIsland' : '_ssrComponent';
}

/**
 * Writes what `_ssrClientComponent` needs of a component rendering only in the browser, since its class may not be
 * there: whether a static template renders it, so that no template sets its inputs in the browser, and its trigger.
 *
 * @param component - The metadata of the component.
 * @param generatorContext - The generator context of the element.
 * @returns The object literal.
 */
function toClientOptions({ selector, clientOnly }: ComponentMetadata, generatorContext: GeneratorContext): string {
  return JSON.stringify({ island: generatorContext.isIsland(selector), hydrate: clientOnly!.hydrate });
}

/**
 * Maps attribute nodes to the descriptors the runtime applies, with the setters of the client reading the value once:
 * an input of a component or of a directive the template imports is set by the name of its property, never by its
 * alias, the one it is exposed with for an input of a host directive, through the setters of the inputs, as the client
 * does.
 *
 * @param attributes - The attribute nodes.
 * @param generatorContext - The generator context of the attributes.
 * @param owner - The tag name of the component, or the selector of the directive as applied in templates
 *   (`@@selector`), the attributes are bound to, `undefined` for a native element.
 * @returns The lines of the descriptors, one per attribute.
 * @throws When a directive the template imports does not declare an attribute bound to it.
 */
function mapAttributes(attributes: AttributeNode[], generatorContext: GeneratorContext, owner: string | undefined): string[] {
  const metadata = owner && attributes.length ? generatorContext.getImportedMetadata(owner) : undefined;
  return attributes.map(({ name, value, span }) => {
    const input = metadata?.properties.get(name);
    if (metadata?.type === 'directive' && !input) {
      throw new Error(`Unable to resolve the metadata of property "${name}" of ${owner}`, { cause: span });
    }

    const target = toStringLiteral(input && !input.exposed ? input.name : name);
    return typeof value === 'string'
      ? `{ name: ${target}, value: ${toStringLiteral(value)}, setter: ${input ? '_setInput' : '_setProperty'} },`
      : `{ name: ${target}, value: () => ${resolve(value.expression, generatorContext)}, setter: ${input ? '_setExpressionInput' : '_setExpressionProperty'} },`;
  });
}

/**
 * Appends to the descriptors of the attributes the ones of the classes the element toggles, as the client does.
 *
 * @param descriptors - The lines of the descriptors of the attributes.
 * @param classBindings - The class binding nodes.
 * @param generatorContext - The generator context of the class bindings.
 */
function appendClassBindings(descriptors: string[], classBindings: ClassBindingNode[], generatorContext: GeneratorContext): void {
  for (let i = 0; i < classBindings.length; i++) {
    const { className, value } = classBindings[i];
    descriptors.push(`{ name: ${toStringLiteral(className)}, value: () => ${resolve(value.expression, generatorContext)}, setter: _setExpressionClass },`);
  }
}

/**
 * Maps conditional binding nodes to the descriptors the runtime selects the branch of: the branches, each one mapped by
 * `mapBranch`, and, for a `@switch`, the expression whose value selects the branch.
 *
 * @param conditionalBindings - The conditional binding nodes.
 * @param generatorContext - The generator context of the conditional bindings.
 * @param isEmpty - Tells whether a branch has nothing to apply: a conditional binding whose branches all have nothing
 *   to apply is skipped.
 * @param mapBranch - Maps a branch, given the lines declaring its condition, to its descriptor.
 * @returns The lines of the descriptors, one per conditional binding.
 */
function mapConditionalBindingDescriptors(
  conditionalBindings: ConditionalBindingNode[],
  generatorContext: GeneratorContext,
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
      mappedBranches.push(...mapBranch(branches[j], mapCondition(conditionalBinding, j, generatorContext)));
    }

    lines.push('{');
    if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
      lines.push(indent(`expression: () => ${resolve(conditionalBinding.expression, generatorContext)},`));
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
 * @param generatorContext - The generator context of the conditional binding.
 * @returns The lines declaring the condition of the branch, if any.
 */
function mapCondition(conditionalBinding: ConditionalBindingNode, index: number, generatorContext: GeneratorContext): string[] {
  if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
    const { condition } = conditionalBinding.branches[index];
    return [`condition: ${condition ? `[${condition.join(', ')}]` : 'null'},`];
  }

  const { condition } = conditionalBinding.branches[index];
  return condition ? [`condition: () => ${resolve(condition, generatorContext)},`] : [];
}

/**
 * Maps a branch of a conditional binding to the descriptor of the attributes and of the classes it applies, of the
 * custom directives it applies, if any and if the element applies them, and of its nested conditional bindings.
 *
 * @param branch - The branch node.
 * @param condition - The lines declaring the condition of the branch.
 * @param component - The tag name of the element when it is a component, whose inputs the attributes may bind,
 *   `undefined` for a native element, which applies its custom directives on the server.
 * @param generatorContext - The generator context of the branch.
 * @returns The lines of the descriptor.
 */
function mapBranch(branch: ConditionalBindingBranchNode, condition: string[], component: string | undefined, generatorContext: GeneratorContext): string[] {
  const withDirectives = !component;
  const attributes = mapAttributes(branch.attributes, generatorContext, component);
  appendSubmitMark(attributes, branch);
  appendClassBindings(attributes, branch.classBindings, generatorContext);
  const conditionalBindings = mapConditionalBindingDescriptors(branch.conditionalBindings, generatorContext, nested => isEmptyBranch(nested, withDirectives), (nested, nestedCondition) => mapBranch(nested, nestedCondition, component, generatorContext));
  const lines = condition.concat(toProperty('attributes', attributes, ','));
  if (withDirectives && branch.directives.length) {
    lines.push(...toProperty('directives', mapDirectives(branch.directives, generatorContext), ','));
  }

  return ['{', ...indent(lines.concat(toProperty('conditionalBindings', conditionalBindings, ''))), '},'];
}

/**
 * Maps a branch of a conditional binding to the descriptor of the structural directives it applies, and of its nested
 * conditional bindings applying them.
 *
 * @param branch - The branch node.
 * @param condition - The lines declaring the condition of the branch.
 * @param generatorContext - The generator context of the branch.
 * @returns The lines of the descriptor.
 */
function mapStructuralBranch(branch: ConditionalBindingBranchNode, condition: string[], generatorContext: GeneratorContext): string[] {
  const structuralDirectives = mapStructuralDirectives(branch.structuralDirectives, generatorContext);
  const conditionalBindings = mapConditionalBindingDescriptors(branch.conditionalBindings, generatorContext, nested => !appliesStructuralDirectives(nested), (nested, nestedCondition) => mapStructuralBranch(nested, nestedCondition, generatorContext));

  return ['{', ...indent(condition.concat(toProperty('structuralDirectives', structuralDirectives, ','), toProperty('conditionalBindings', conditionalBindings, ''))), '},'];
}

/**
 * Maps custom directive nodes to the descriptors `_ssrStartTag` applies: the selector and the properties. Their events
 * and their conditional bindings are left out, as the events of the element: the server listens to nothing.
 *
 * @param directives - The custom directive nodes.
 * @param generatorContext - The generator context of the directives.
 * @returns The lines of the descriptors, one per directive.
 */
function mapDirectives(directives: DirectiveNode[], generatorContext: GeneratorContext): string[] {
  const lines = new Array<string>();
  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes } = directives[i];
    lines.push('{', ...indent([`selector: ${toStringLiteral(selector)},`].concat(toProperty('attributes', mapAttributes(attributes, generatorContext, `@@${selector}`), ''))), '},');
  }

  return lines;
}

/**
 * Maps structural directive nodes to the descriptors the runtime evaluates: the selector and the properties.
 *
 * @param structuralDirectives - The structural directive nodes.
 * @param generatorContext - The generator context of the structural directives.
 * @returns The lines of the descriptors, one per structural directive.
 */
function mapStructuralDirectives(structuralDirectives: StructuralDirectiveNode[], generatorContext: GeneratorContext): string[] {
  const lines = new Array<string>();
  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    lines.push('{', ...indent([`selector: ${toStringLiteral(selector)},`].concat(toProperty('attributes', mapAttributes(attributes, generatorContext, `@@${selector}`), ''))), '},');
  }

  return lines;
}

/**
 * Tells whether a branch of a conditional binding writes nothing on the server: no attribute, no class, no mark of
 * `submit` and no custom directive, when the element applies them, neither directly nor through its nested conditional
 * bindings. Its other events are left out.
 *
 * @param branch - The branch node.
 * @param withDirectives - Whether the element applies its custom directives on the server.
 * @returns `true` when the branch writes nothing.
 */
function isEmptyBranch(branch: ConditionalBindingBranchNode, withDirectives: boolean): boolean {
  const { attributes, classBindings, directives, conditionalBindings } = branch;
  return !attributes.length && !classBindings.length && !listensToSubmit(branch) && !(withDirectives && directives.length) && conditionalBindings.every(({ branches }) => branches.every(nested => isEmptyBranch(nested, withDirectives)));
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
 * @param generatorContext - The generator context of the element.
 * @returns The resolved expression.
 */
function resolve(expression: Parameters<typeof resolveExpression>[0], generatorContext: GeneratorContext): string {
  return resolveExpression(expression, generatorContext, SERVER_RESOLVE_OPTIONS).expression;
}
