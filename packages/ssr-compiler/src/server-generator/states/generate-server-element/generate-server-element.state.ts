import { dropsLeadingNewline, escapeAttribute, isValidCustomElementName, isVoidElement } from '@xaendar/common';
import { appendBlockPosition, ASTNodeType, declareExpression, describeStyling, getDirectiveOrder, mapContentTemplates, orderDirectives, splitStylingAttributes, GeneratorContext, getChildrenNamespace, getElementIdentifier, getElementNamespace, isStructuralElement, resolveExpression, toArrayLiteral, toObjectLiteral, toRoleName, toStringLiteral, type AttributeNode, type ComponentMetadata, type ConditionalBindingBranchNode, type ConditionalBindingNode, type DescriptorOwner, type DirectiveNode, type ElementNode, type StructuralDirectiveNode } from '@xaendar/compiler';
import type { Function } from '@xaendar/types';
import type { ServerCodePiece } from '../../types/server-code-piece.type';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { GenerateChildren } from '../../types/generate-children.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS, toStatements } from '../../utils/server-code/server-code.utils';
import { SUBMIT_ATTRIBUTE } from '../../../costants/ssr-markers.constants';

/**
 * Generates the code writing an element: its start tag, its children and its end tag.
 *
 * A native element with only static and expression attributes, the most common case, is written as HTML, each attribute
 * bound to an expression written when it is rendered by `_ssrAttribute`, which escapes its value and leaves it out for
 * `null` and `undefined`, as the client removes it. An element toggling classes, with conditional bindings or applying custom
 * directives writes its start tag through `_ssrStartTag`, which applies the bindings and the directives as the client
 * applies them, receiving a constant of the module describing the element (`div0$element`), whose expressions are
 * functions of the module named after the element and called with the component and the context, and a component through
 * `_ssrComponent`, which renders it, `_ssrIsland` for an interactive one a static template renders, or
 * `_ssrClientComponent` for one rendering only in the browser, whose class may not be there. The children of the element are written in the same function, since they are not
 * a scope of their own, except for the content of an element a structural directive is applied to: that element is
 * written by the function of the module `_ssrStructural` calls when every structural directive allows it (`div0$render`,
 * named by the constant `div0$structural` with the structural directives), and its content by a function of its own,
 * named like the one of the client.
 *
 * The events are left out: the server writes HTML, the client listens to them. The custom directives of a native
 * element, its own and the ones of its conditional bindings, are applied by `_ssrStartTag` without their events: their
 * `onInit` runs, their effects do not. The ones of a component are left out, the client applies them. The names of the
 * events are registered for the event contract of the page, and an element listening to `submit` is marked
 * by an attribute, the one thing the contract has to know of an element: it must prevent the submission before the
 * runtime is there.
 * An element ref is `undefined` on the server, initialized when the render reaches the element, as on the client.
 * The content of a standard `<template>` element is written as the HTML the compiler serialized (`ElementNode.content`),
 * the one the client assigns to its `innerHTML`.
 *

 * @param node - The element node.
 * @param parent - Where the element is rendered.
 * @param index - The position of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @param generateChildren - Generates the code of the children of the element, in the function being written.
 * @param last - Whether the element is the last node of its parent: applying structural directives, it is a block,
 *   written without the marker closing it, as the client renders it without anchor (see `isLastRenderedChild`).
 * @returns The code of the element, and the functions it calls.
 */
export function generateServerElement(node: ElementNode, parent: ServerParent, index: string, generatorContext: GeneratorContext, generateChildren: GenerateChildren, last = false): ServerTransitionResult {
  const { tagName } = node;
  const id = getElementIdentifier(node, parent.id, index);
  const childrenNamespace = getChildrenNamespace(tagName, getElementNamespace(tagName, generatorContext.namespace));
  const childrenParent: ServerParent = { id, tag: tagName, end: true };
  const { content } = node;
  if (!isStructuralElement(node)) {
    if (content !== undefined) {
      return { pieces: writeElement(node, id, generatorContext, toContentPieces(content)) };
    }

    // Generated in the function of the element, the children stand for no scope of the runtime
    const childrenContext = childrenNamespace !== generatorContext.namespace ? new GeneratorContext(generatorContext, childrenNamespace, 'declarations') : generatorContext;
    const children = generateChildren(node.children, childrenParent, childrenContext);
    return { pieces: writeElement(node, id, generatorContext, children.pieces), functionsToProcess: children.functionsToProcess };
  }

  const owner: DescriptorOwner = { name: id, generatorContext };
  const structuralDirectives = mapStructuralDirectives(node.structuralDirectives, owner);
  const structuralConditionalBindings = mapConditionalBindingDescriptors(node.conditionalBindings, owner, branch => !appliesStructuralDirectives(branch), (branch, condition) => mapStructuralBranch(branch, condition, owner));
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  const children = content === undefined ? new Array<ServerCodePiece>() : toContentPieces(content);
  if (content === undefined && node.children.length) {
    const key = `${id}Children`;
    functionsToProcess.set(key, { fn: { node, context: new GeneratorContext(generatorContext, childrenNamespace), parent: childrenParent }, args: ['out', 'parentContext'] });
    children.push({ statement: `${key}.call(this, out, context);` });
  }

  const members = new Array<string>();
  appendList(members, 'structuralDirectives', structuralDirectives);
  appendList(members, 'structuralConditionalBindings', structuralConditionalBindings);
  appendBlockPosition(members, last);
  members.push(`render: ${generatorContext.declareFunction(`${id}$render`, 'out, context', toStatements(writeElement(node, id, generatorContext, children)))}`);
  return {
    pieces: [{ statement: `_ssrStructural(out, context, ${generatorContext.declareConstant(`${id}$structural`, toObjectLiteral(members))});` }],
    functionsToProcess
  };
}

/**
 * Writes the static content of a standard `<template>` element, the HTML the client assigns to its `innerHTML`, as it
 * is.
 *
 * @param content - The HTML of the content.
 * @returns The code of the content, nothing when it is empty.
 */
function toContentPieces(content: string): ServerCodePiece[] {
  return content ? [{ html: content }] : [];
}

/**
 * Writes an element: its start tag, as HTML or through the runtime (see {@link generateServerElement}), a line feed for
 * an element whose leading one the parser drops, its children, and its end tag, unless it is a void element.
 *
 * @param node - The element node.
 * @param id - The name of the element in the generated code, which the constant describing it and the functions of its
 *   expressions are named after.
 * @param generatorContext - The generator context of the node.
 * @param children - The code of the children.
 * @returns The code of the element.
 */
function writeElement(node: ElementNode, id: string, generatorContext: GeneratorContext, children: readonly ServerCodePiece[]): ServerCodePiece[] {
  const { tagName, attributes, classBindings, styleBindings, ref } = node;
  const owner: DescriptorOwner = { name: id, generatorContext };
  const isHtml = getElementNamespace(tagName, generatorContext.namespace) === 'html';
  const isComponent = isValidCustomElementName(tagName, false) && !generatorContext.isForeignElement(tagName);
  // Only a native element applies its custom directives on the server
  const withDirectives = !isComponent;
  orderDirectives(node);
  const conditionalBindings = mapConditionalBindingDescriptors(node.conditionalBindings, owner, branch => isEmptyBranch(branch, withDirectives), (branch, condition) => mapBranch(branch, condition, isComponent ? tagName : undefined, owner));
  const directives = withDirectives ? mapDirectives(node.directives, owner) : undefined;
  const pieces = new Array<ServerCodePiece>();
  if (ref) {
    const { depth, slot } = generatorContext.addressOf(ref.name)!;
    pieces.push({ statement: `_set(context, ${depth}, ${slot}, undefined);` });
  }

  registerEvents(node, generatorContext);

  if (isComponent || classBindings.length || styleBindings.length || conditionalBindings.length || directives?.length) {
    const descriptors = mapBindings(node, owner, isComponent ? tagName : undefined);
    appendSubmitMark(descriptors, node);
    const members = [`tagName: '${tagName}'`];
    appendList(members, 'attributes', descriptors);
    appendList(members, 'conditionalBindings', conditionalBindings);
    if (isComponent) {
      appendList(members, 'templates', mapContentTemplates(node, generatorContext));
    }
    const clientComponent = isComponent ? generatorContext.getClientComponent(tagName) : undefined;
    if (!clientComponent && directives?.length) {
      appendList(members, 'directives', directives);
    }

    const element = generatorContext.declareConstant(`${id}$element`, toObjectLiteral(members));
    const options = clientComponent ? `, ${generatorContext.declareConstant(`${id}$client`, toClientOptions(clientComponent, generatorContext))}` : '';
    pieces.push({ statement: `${getStartTagWriter(tagName, isComponent, generatorContext)}(out, context, ${element}${options});` });
  } else {
    pieces.push({ html: `<${tagName}` });
    for (let i = 0; i < attributes.length; i++) {
      const { name, value } = attributes[i];
      typeof value === 'string'
        ? pieces.push({ html: ` ${name}="${escapeAttribute(value)}"` })
        : pieces.push({ value: `_ssrAttribute('${name}', ${resolve(value.expression, generatorContext)})` });
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
 * @param descriptors - The code of the descriptors of the attributes.
 * @param bindings - The element or the branch.
 */
function appendSubmitMark(descriptors: string[], bindings: Pick<ConditionalBindingBranchNode, 'events'>): void {
  if (listensToSubmit(bindings)) {
    descriptors.push(`{ name: '${SUBMIT_ATTRIBUTE}', value: '', setter: _setProperty }`);
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
 * does. The value of an expression is a function of the module named after the element and the attribute, as on the
 * client.
 *
 * @param attributes - The attribute nodes.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param target - The tag name of the component, or the selector of the directive as applied in templates
 *   (`@@selector`), the attributes are bound to, `undefined` for a native element.
 * @returns The code of the descriptors, one per attribute.
 * @throws When a directive the template imports does not declare an attribute bound to it.
 */
function mapAttributes(attributes: AttributeNode[], owner: DescriptorOwner, target: string | undefined): string[] {
  const { generatorContext } = owner;
  const metadata = target && attributes.length ? generatorContext.getImportedMetadata(target) : undefined;
  return attributes.map(({ name, value, span }) => {
    const input = metadata?.properties.get(name);
    if (metadata?.type === 'directive' && !input) {
      throw new Error(`Unable to resolve the metadata of property "${name}" of ${target}`, { cause: span });
    }

    const property = input && !input.exposed ? input.name : name;
    if (typeof value === 'string') {
      return toObjectLiteral([`name: ${toStringLiteral(property)}`, `value: ${toStringLiteral(value)}`, `setter: ${input ? '_setInput' : '_setProperty'}`]);
    }

    const role = metadata?.type === 'directive' ? `${toRoleName(target!.slice(2))}_${toRoleName(property)}` : toRoleName(property);
    return toObjectLiteral([`name: ${toStringLiteral(property)}`, `value: ${declareElementExpression(owner, role, value.expression)}`, `setter: ${input ? '_setExpressionInput' : '_setExpressionProperty'}`]);
  });
}

/**
 * Maps the bindings of an element, or of a branch of one of its conditional bindings, to the descriptors the runtime
 * applies, as the client does: its `class` and its `style`, one descriptor each (see `describeStyling`), merged key by
 * key with the directives and the component writing them, written once (`_setStyling`, `_setExpressionStyling`),
 * unless the component declares an input with their name, then its other attributes (see {@link mapAttributes}).
 *
 * @param bindings - The attributes, the classes and the style properties bound.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param component - The tag name of the element when it is a component, `undefined` for a native element.
 * @returns The code of the descriptors.
 * @throws When a directive the template imports does not declare an attribute bound to it.
 */
function mapBindings({ attributes, classBindings, styleBindings }: Pick<ElementNode, 'attributes' | 'classBindings' | 'styleBindings'>, owner: DescriptorOwner, component: string | undefined): string[] {
  const metadata = component && attributes.length ? owner.generatorContext.getImportedMetadata(component) : undefined;
  const [rest, classAttribute, styleAttribute] = splitStylingAttributes(attributes, name => !!metadata?.properties.has(name));
  const descriptors = new Array<string>();
  appendStyling(descriptors, describeStyling('class', classAttribute, classBindings, (role, expression) => declareElementExpression(owner, role, expression)));
  appendStyling(descriptors, describeStyling('style', styleAttribute, styleBindings, (role, expression) => declareElementExpression(owner, role, expression)));
  return descriptors.concat(mapAttributes(rest, owner, component));
}

/**
 * Appends the descriptor of the `class` or of the `style` of an element, written once: `_setStyling` for a static
 * string alone, `_setExpressionStyling` for expressions.
 *
 * @param descriptors - The code of the descriptors.
 * @param members - The members of the descriptor, `undefined` when the element writes nothing on the attribute.
 */
function appendStyling(descriptors: string[], members: string[] | undefined): void {
  if (members) {
    const expressions = members.some(member => member.startsWith('string:') || member.startsWith('values:'));
    members.push(`setter: ${expressions ? '_setExpressionStyling' : '_setStyling'}`);
    descriptors.push(toObjectLiteral(members));
  }
}

/**
 * Maps conditional binding nodes to the descriptors the runtime selects the branch of: the branches, each one mapped by
 * `mapBranch`, and, for a `@switch`, the expression whose value selects the branch.
 *
 * @param conditionalBindings - The conditional binding nodes.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param isEmpty - Tells whether a branch has nothing to apply: a conditional binding whose branches all have nothing
 *   to apply is skipped.
 * @param mapBranch - Maps a branch, given the member declaring its condition, if any, to its descriptor.
 * @returns The code of the descriptors, one per conditional binding.
 */
function mapConditionalBindingDescriptors(
  conditionalBindings: ConditionalBindingNode[],
  owner: DescriptorOwner,
  isEmpty: Function<[branch: ConditionalBindingBranchNode], boolean>,
  mapBranch: Function<[branch: ConditionalBindingBranchNode, condition: string | undefined], string>
): string[] {
  const descriptors = new Array<string>();
  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    const { branches } = conditionalBinding;
    if (branches.every(isEmpty)) {
      continue;
    }

    const mappedBranches = new Array<string>();
    for (let j = 0; j < branches.length; j++) {
      mappedBranches.push(mapBranch(branches[j], mapCondition(conditionalBinding, j, owner)));
    }

    const members = new Array<string>();
    if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
      members.push(`expression: ${declareElementExpression(owner, 'switch', conditionalBinding.expression)}`);
    }

    members.push(`branches: ${toArrayLiteral(mappedBranches)}`);
    descriptors.push(toObjectLiteral(members));
  }

  return descriptors;
}

/**
 * Maps what selects a branch of a conditional binding, as the client does: the condition of an `@if` or `@else if`
 * branch, the values of the `@case`s of a `@switch` branch, written as declared, `null` for a `@default`, nothing for an
 * `@else`.
 *
 * @param conditionalBinding - The conditional binding node.
 * @param index - The position of the branch.
 * @param owner - The element, which the functions of the conditions are named after.
 * @returns The member declaring the condition of the branch, `undefined` for an `@else`.
 */
function mapCondition(conditionalBinding: ConditionalBindingNode, index: number, owner: DescriptorOwner): string | undefined {
  if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
    const { condition } = conditionalBinding.branches[index];
    return `condition: ${condition ? `[${condition.join(', ')}]` : 'null'}`;
  }

  const { condition } = conditionalBinding.branches[index];
  return condition ? `condition: ${declareElementExpression(owner, 'if', condition)}` : undefined;
}

/**
 * Maps a branch of a conditional binding to the descriptor of the attributes and of the classes it applies, of the
 * custom directives it applies, if any and if the element applies them, and of its nested conditional bindings.
 *
 * @param branch - The branch node.
 * @param condition - The member declaring the condition of the branch, if any.
 * @param component - The tag name of the element when it is a component, whose inputs the attributes may bind,
 *   `undefined` for a native element, which applies its custom directives on the server.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptor.
 */
function mapBranch(branch: ConditionalBindingBranchNode, condition: string | undefined, component: string | undefined, owner: DescriptorOwner): string {
  const withDirectives = !component;
  const attributes = mapBindings(branch, owner, component);
  appendSubmitMark(attributes, branch);
  const members = condition ? [condition] : new Array<string>();
  appendList(members, 'attributes', attributes);
  if (withDirectives) {
    appendList(members, 'directives', mapDirectives(branch.directives, owner));
  }

  appendList(members, 'conditionalBindings', mapConditionalBindingDescriptors(branch.conditionalBindings, owner, nested => isEmptyBranch(nested, withDirectives), (nested, nestedCondition) => mapBranch(nested, nestedCondition, component, owner)));
  return toObjectLiteral(members);
}

/**
 * Maps a branch of a conditional binding to the descriptor of the structural directives it applies, and of its nested
 * conditional bindings applying them.
 *
 * @param branch - The branch node.
 * @param condition - The member declaring the condition of the branch, if any.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptor.
 */
function mapStructuralBranch(branch: ConditionalBindingBranchNode, condition: string | undefined, owner: DescriptorOwner): string {
  const members = condition ? [condition] : new Array<string>();
  appendList(members, 'structuralDirectives', mapStructuralDirectives(branch.structuralDirectives, owner));
  appendList(members, 'conditionalBindings', mapConditionalBindingDescriptors(branch.conditionalBindings, owner, nested => !appliesStructuralDirectives(nested), (nested, nestedCondition) => mapStructuralBranch(nested, nestedCondition, owner)));
  return toObjectLiteral(members);
}

/**
 * Maps custom directive nodes to the descriptors `_ssrStartTag` applies: the selector and the properties. Their events
 * and their conditional bindings are left out, as the events of the element: the server listens to nothing.
 *
 * @param directives - The custom directive nodes.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptors, one per directive.
 */
function mapDirectives(directives: DirectiveNode[], owner: DescriptorOwner): string[] {
  return directives.map(directive => toDirectiveDescriptor(directive.selector, directive.attributes, owner, getDirectiveOrder(directive)));
}

/**
 * Maps structural directive nodes to the descriptors the runtime evaluates: the selector and the properties.
 *
 * @param structuralDirectives - The structural directive nodes.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptors, one per structural directive.
 */
function mapStructuralDirectives(structuralDirectives: StructuralDirectiveNode[], owner: DescriptorOwner): string[] {
  return structuralDirectives.map(({ selector, attributes }) => toDirectiveDescriptor(selector, attributes, owner));
}

/**
 * Writes the descriptor of a directive: its selector, its order among the directives of its element, if any, as the
 * client writes it, and its properties, left out when it binds none.
 *
 * @param selector - The selector of the directive.
 * @param attributes - The attribute nodes binding its properties.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param order - The position of the directive among the ones of its element, if any.
 * @returns The code of the descriptor.
 */
function toDirectiveDescriptor(selector: string, attributes: AttributeNode[], owner: DescriptorOwner, order?: number): string {
  const members = [`selector: ${toStringLiteral(selector)}`];
  if (order) {
    members.push(`order: ${order}`);
  }

  appendList(members, 'attributes', mapAttributes(attributes, owner, `@@${selector}`));
  return toObjectLiteral(members);
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
  const { attributes, classBindings, styleBindings, directives, conditionalBindings } = branch;
  return !attributes.length && !classBindings.length && !styleBindings.length && !listensToSubmit(branch) && !(withDirectives && directives.length) && conditionalBindings.every(({ branches }) => branches.every(nested => isEmptyBranch(nested, withDirectives)));
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
 * Appends a list member of the descriptor of an element, a directive or a branch, unless the list is empty: the runtime
 * reads a list left out as empty.
 *
 * @param members - The members of the object literal being written.
 * @param name - The name of the member.
 * @param items - The code of the items of the list.
 */
function appendList(members: string[], name: string, items: readonly string[]): void {
  if (items.length) {
    members.push(`${name}: ${toArrayLiteral(items)}`);
  }
}

/**
 * Declares the function of the module computing the value of an expression of an element, read once, as the server reads
 * every value (see `declareExpression`): named after the element and the role of the expression (`div0$title`), it is
 * called by the runtime with the component and the context. An expression reading no name is the same.
 *
 * @param owner - The element.
 * @param role - What the expression is, the part of the name of the function after `$`.
 * @param expression - The expression.
 * @returns The name of the function.
 */
function declareElementExpression(owner: DescriptorOwner, role: string, expression: Parameters<typeof resolveExpression>[0]): string {
  return declareExpression(owner.generatorContext, `${owner.name}$${role}`, resolve(expression, owner.generatorContext));
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
