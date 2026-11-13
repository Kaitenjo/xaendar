import { isValidCustomElementName, type KeyEventFilter } from '@xaendar/common';
import type { AsyncFunction, Function } from '@xaendar/types';
import { factory, identifierToKeywordKind, SyntaxKind, type Expression } from 'typescript';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../../parser/types/nodes/class-binding-node.type';
import type { StyleBindingNode } from '../../../parser/types/nodes/style-binding-node.type';
import { ConditionalBindingBranchNode } from '../../../parser/types/nodes/conditional-binding-branch-node.type';
import { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { EventNode } from '../../../parser/types/nodes/event-node.type';
import type { StructuralDirectiveNode } from '../../../parser/types/nodes/structural-directive-node.type';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import { isStructuralElement } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
import { getChildrenNamespace, getElementNamespace } from '../../../utils/element-namespace/element-namespace.utils';
import { readsEvent } from '../../../utils/event-reads/event-reads.utils';
import { mapContentTemplates } from '../../../utils/content-templates/content-templates.utils';
import { GeneratorContext } from '../../context/context';
import type { ElementNamespace } from '../../../types/element-namespace.type';
import type { DescriptorOwner } from '../../types/descriptor-owner.type';
import type { StylingExpressions } from '../../types/styling-expressions.type';
import type { TemplateListenerCode } from '../../types/template-listener-code.type';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getElementIdentifier, isConstantExpression, joinVariables, resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';
import { appendBlockPosition, appendContainer, rendersBlock } from '../../utils/block-position/block-position.utils';
import { describeStyling, getDirectiveOrder, orderDirectives, splitStylingAttributes } from '../../utils/styling/styling.utils';
import { declareExpression, toArrayLiteral, toObjectLiteral, toRoleName } from '../../utils/module-code/module-code.utils';

/**
 * Generates code for an HTML element node: creates the DOM element, sets attributes,
 * attaches event listeners, applies conditional bindings and directives, appends it to the parent,
 * and recursively processes children.
 *
 * The element is described by a constant of the module (`td0$element`, see `RenderElement` of the runtime), which
 * `_renderElement` receives: its tag, its attributes, its listeners, its conditional bindings, its directives, the
 * function rendering its children and its element ref. Every expression it holds is a function of the module, named
 * after the element and the role of the expression (`tr0$class`, `td0$on_click`), which the runtime calls with the
 * component and the context: nothing of it is created at each render. The lists the element does not declare are left
 * out, and so is the namespace of an HTML element: an SVG or a MathML one, which the compiler knows from its place in the
 * template, names its namespace, so that the runtime creates it there wherever it is rendered, in a block, in a template
 * declared in an `<svg>` and rendered elsewhere, or in the HTML of a `<foreignObject>`.
 *
 * The children are rendered by `_renderElement` through the function the constant names, since an element applying
 * structural directives is created, and created again, by the runtime only while they allow it: it receives the context
 * the children are rendered in, whose strategy gets their nodes, created or adopted from the HTML rendered on the server.
 * A standard `<template>` element has no function of the children: its constant holds the HTML of its static content
 * (`content`), which the runtime assigns to the `innerHTML` of a `<template>` it creates.
 * Its `class` and its `style` are described one each (see `mapStyling`), merged key by key with the other sources writing
 * them: `styling` flags the states the runtime creates before applying them (see `stylingFlags`).
 * The conditional bindings declared on the element are split in two lists: the descriptors of the element bindings
 * leave out the structural directives, the ones of the structural conditional bindings keep only them.
 *
 * @param node - The `ElementNode` to process.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param index - The position of the element among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The node the element is rendered before, `null` to append it.
 * @param _separated - Unused: an element is never separated from a text.
 * @param last - Whether the element is the last node of its parent: applying structural directives, it is a block
 *   rendered without anchor (see `isLastRenderedChild`).
 * @returns The generated code and the function rendering the children, if any.
 */
export async function generateElement(node: ElementNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const tagName = node.tagName;
  const nodeName = getElementIdentifier(node, parentNode, index);
  // A custom element of another library has no metadata: it is generated like a native element
  const isCustomElement = isValidCustomElementName(tagName, false) && !generatorContext.isForeignElement(tagName);
  const structural = isStructuralElement(node);
  const owner: DescriptorOwner = { name: nodeName, generatorContext };
  /*
    An element structural directives are applied to is rendered in a scope of its own, which the runtime creates and
    clears with it: its bindings, its directives and its children are resolved in a generator context standing for it,
    while the structural directives are bound in the scope of the element
  */
  const elementOwner: DescriptorOwner = structural ? { name: nodeName, generatorContext: new GeneratorContext(generatorContext, undefined, 'runtime') } : owner;
  orderDirectives(node);
  const [attributes, written] = await mapBindings(node, elementOwner, tagName, isCustomElement, false, false);
  const events = mapEvents(node.events, elementOwner);
  const conditionalBindings = await mapConditionalBindings(node.conditionalBindings, elementOwner, tagName, isCustomElement);
  const directives = await mapDirectives(node.directives, elementOwner);
  const structuralDirectives = await mapStructuralDirectives(node.structuralDirectives, owner);
  const structuralConditionalBindings = await mapStructuralConditionalBindings(node.conditionalBindings, owner);
  // The children of a standard <template> are its static content, written as HTML
  const hasChildren = node.content === undefined && !!node.children.length;
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  const namespace = getElementNamespace(tagName, generatorContext.namespace);
  const members = [`tagName: '${tagName}'`];
  appendNamespace(members, namespace);
  appendList(members, 'attributes', attributes);
  appendList(members, 'events', events);
  appendList(members, 'conditionalBindings', conditionalBindings);
  appendList(members, 'directives', directives);
  appendList(members, 'structuralDirectives', structuralDirectives);
  appendList(members, 'structuralConditionalBindings', structuralConditionalBindings);
  const styling = stylingFlags(node, written, structural);
  if (styling) {
    members.push(`styling: ${styling}`);
  }

  if (hasChildren) {
    members.push(`children: ${nodeName}Children`);
  }

  if (node.content) {
    members.push(`content: ${toStringLiteral(node.content)}`);
  }

  if (isCustomElement) {
    appendList(members, 'templates', mapContentTemplates(node, generatorContext));
  }

  /*
    The element ref naming the element, declared by the scope rendering it (an element structural directives are applied
    to declares none), is initialized in its slot once the element is created
  */
  if (node.ref) {
    members.push(`ref: '${node.ref.name}'`, `refSlot: ${generatorContext.addressOf(node.ref.name)!.slot}`);
  }

  // Only an element applying structural directives is a block: its slot is the one of its anchor, if it has one
  appendBlockPosition(members, last && structural, structural && last ? undefined : generatorContext.allocateNodeSlot());
  if (structural) {
    appendContainer(members, generatorContext);
  }

  const element = generatorContext.declareConstant(`${nodeName}$element`, toObjectLiteral(members));
  retVal.code.push(`_renderElement(${parentNode}, context, ${anchor}, ${element});`);

  if (hasChildren) {
    const childrenNamespace = getChildrenNamespace(tagName, namespace);
    retVal.functionsToProcess!.set(`${nodeName}Children`, {
      fn: {
        node,
        parentNode: nodeName,
        /*
          The content of an element a structural directive is applied to is a scope of its own, created and destroyed with
          it, and the children of an element opening a namespace are generated in it, so that their elements name it: at
          runtime they are rendered in the context of the element all the same. The content of an element a structural
          directive is applied to rendering a block opens a runtime scope even without names, which holds the container of
          the block (see `allocateContainer`)
        */
        context: structural || childrenNamespace !== generatorContext.namespace ? new GeneratorContext(elementOwner.generatorContext, childrenNamespace, structural && rendersBlock(node.children) ? 'scope' : 'declarations') : generatorContext
      },
      // The function takes the context of the element instead, when it renders the children in it (see `Generator`)
      args: [nodeName, 'parentContext']
    });
  }

  return retVal;
}

/**
 * Appends the namespace of an element to the members of its configuration, as the runtime reads it (see
 * `RenderElementNamespace`): `1` for SVG, `2` for MathML, nothing for HTML.
 *
 * N.B. Deliberate, to save memory: nothing for an HTML element, nearly every element, whose configuration keeps the shape
 * it had, and a number for the others, instead of the factory each context held and the context the children of an
 * `<svg>` needed only to change it. Do not write the namespace of an HTML element.
 *
 * @param members - The members of the object literal being written.
 * @param namespace - The namespace of the element.
 */
function appendNamespace(members: string[], namespace: ElementNamespace): void {
  switch (namespace) {
    case 'svg':
      members.push('namespace: 1');
      break;

    case 'mathml':
      members.push('namespace: 2');
      break;
  }
}

/**
 * Appends a list member of the configuration of an element, a directive or a branch, unless the list is empty: the
 * runtime reads a list left out as empty.
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
 * Declares the function of the module computing the value of an expression of an element (see `declareExpression`).
 *
 * @param owner - The element.
 * @param role - What the expression is, the part of the name of the function after `$`.
 * @param expression - The resolved expression.
 * @param parameters - The parameters of the function. Defaults to the context alone.
 * @returns The name of the function.
 */
function declareElementExpression(owner: DescriptorOwner, role: string, expression: string, parameters?: string): string {
  return declareExpression(owner.generatorContext, `${owner.name}$${role}`, expression, parameters);
}

/**
 * Maps attribute nodes to their descriptors.
 *
 * An input of a component or of a directive, known from the metadata of its owner, is set by the name of its property,
 * never by its alias, the one it is exposed with for an input of a host directive, through the setters of the inputs:
 * an element whose class is not defined yet, e.g. one of a component loaded lazily, holds the value until the class
 * recovers it. Every attribute of a directive is one of its inputs, since a directive has no underlying attribute.
 * A value is a literal, written once, or an expression, a function of the module named after the element and the
 * attribute: one reading no name is evaluated once (`_setExpressionProperty`, `_setExpressionInput`), any other one is a
 * binding (`_setReactiveProperty`, `_setReactiveInput`) the runtime runs again when a signal it reads changes,
 * receiving in `reads` the names of the variables of the template it reads, so that it runs again when they change too.
 * Attributes declared inside a conditional binding also get the `unbind` applied when their
 * branch is no longer the selected one: a property of a custom element or of a directive, known from
 * the metadata of its owner, is reset at runtime to the default value its owner declares, any other
 * attribute is removed.
 * A required property gets no `unbind`, since the branch selected next binds it again.
 *
 * @param attributes - The attribute nodes to map onto the element or the directive.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param target - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the attributes are bound to.
 * @param isCustomElement - Whether the owner is a custom element.
 * @param isDirective - Whether the owner is a directive.
 * @param conditional - Whether the attributes are declared inside a conditional binding.
 * @returns The code of the descriptors, one per attribute.
 * @throws If the metadata of a directive property can't be resolved, or a two-way binding binds no input.
 */
async function mapAttributes(attributes: AttributeNode[], owner: DescriptorOwner, target: string, isCustomElement: boolean, isDirective: boolean, conditional: boolean): Promise<string[]> {
  const mappedAttributes = new Array<string>();
  const { generatorContext } = owner;
  // Native elements have no metadata
  const metadata = attributes.length && (isCustomElement || isDirective) ? await generatorContext.cache?.getOrInsert(target) : undefined;
  for (let i = 0; i < attributes.length; i++) {
    const { name, value, twoWay } = attributes[i];
    const input = metadata?.properties.get(name);
    if (twoWay && !input) {
      throw new Error(`[(${name})] binds a model of a component or of a directive: ${target} has no input "${name}"`, { cause: attributes[i].span });
    }

    if (isDirective && !input) {
      // Unlike components, a non-recognized property cannot be applied as an attribute on the DOM element itself
      throw new Error(`Unable to resolve the metadata of property "${name}" of ${target}`, { cause: attributes[i].span });
    }

    const property = input && !input.exposed ? input.name : name;
    const members = [`name: '${property}'`];
    // The setter evaluating the expression once, which runs a binding again too: `undefined` for a descriptor written once
    let update: string | undefined;
    let role = '';
    let reads: string | undefined;
    if (typeof value === 'string') {
      members.push(`value: ${toStringLiteral(value)}`, `setter: ${input ? '_setInput' : '_setProperty'}`);
    } else {
      const { expression, variables } = resolveExpression(value.expression, generatorContext);
      const once = input ? '_setExpressionInput' : '_setExpressionProperty';
      role = isDirective ? `${toRoleName(target.slice(2))}_${toRoleName(property)}` : toRoleName(property);
      members.push(`value: ${declareElementExpression(owner, role, expression)}`);
      if (isConstantExpression(value.expression)) {
        members.push(`setter: ${once}`);
      } else {
        update = once;
        reads = generatorContext.getReads(variables);
        members.push(`setter: ${input ? '_setReactiveInput' : '_setReactiveProperty'}`);
        appendReads(members, reads);
      }
    }

    if (conditional) {
      /*
        A required property has no default value to be reset to, and it doesn't need one: the typechecker
        accepts it inside a conditional binding only when every branch binds it, up to an `@else` or a
        `@default` one, so the branch selected next always binds it again.
      */
      if (!input) {
        members.push('unbind: _removeAttribute');
      } else if (!input.required) {
        members.push('unbind: _resetProperty');
      }
    }

    mappedAttributes.push(update ? declareAttribute(owner, role, update, members, reads) : toObjectLiteral(members));
  }

  return mappedAttributes;
}

/**
 * Writes the descriptor of a binding of an element, an attribute or a class: rendered in a scope of the compiler, it is a
 * constant of the module, named after the element and its role (`td0$class$binding`), which the layout of the scope lists
 * (see `declareBinding`), otherwise an object literal of the list holding it.
 *
 * @param owner - The element.
 * @param role - The role of the binding.
 * @param update - The callback of the binding: the setter evaluating the expression once.
 * @param members - The members of the descriptor.
 * @param reads - The constant listing the variables of the template the binding reads, if any.
 * @returns The code of the descriptor.
 */
function declareAttribute(owner: DescriptorOwner, role: string, update: string, members: string[], reads: string | undefined): string {
  return owner.generatorContext.declareBinding(`${owner.name}$${role}$binding`, members, update, !!reads) ?? toObjectLiteral(members);
}

/**
 * Maps the bindings of an element, or of a branch of one of its conditional bindings, to their descriptors: its `class`
 * and its `style`, each one described once (see {@link mapStyling}), unless the component declares an input with their
 * name, then its other attributes and its inputs (see {@link mapAttributes}). The bindings of a directive are its
 * inputs.
 *
 * @param bindings - The attributes, the classes and the style properties bound.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param target - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`).
 * @param isCustomElement - Whether the owner is a custom element.
 * @param isDirective - Whether the owner is a directive.
 * @param conditional - Whether the bindings are declared inside a conditional binding.
 * @returns The code of the descriptors, and what they write: `1` for `class`, `2` for `style`.
 * @throws If the metadata of a directive property can't be resolved.
 */
async function mapBindings({ attributes, classBindings, styleBindings }: Pick<ElementNode, 'attributes' | 'classBindings' | 'styleBindings'>, owner: DescriptorOwner, target: string, isCustomElement: boolean, isDirective: boolean, conditional: boolean): Promise<[descriptors: string[], styling: number]> {
  if (isDirective) {
    return [await mapAttributes(attributes, owner, target, false, true, conditional), 0];
  }

  // Native elements have no metadata
  const metadata = isCustomElement && attributes.length ? await owner.generatorContext.cache?.getOrInsert(target) : undefined;
  const [rest, classAttribute, styleAttribute] = splitStylingAttributes(attributes, name => !!metadata?.properties.has(name));
  const mapped = new Array<string>();
  let styling = 0;
  const classes = mapStyling('class', classAttribute, classBindings, owner, conditional);
  if (classes) {
    mapped.push(classes);
    styling |= 1;
  }

  const style = mapStyling('style', styleAttribute, styleBindings, owner, conditional);
  if (style) {
    mapped.push(style);
    styling |= 2;
  }

  return [mapped.concat(await mapAttributes(rest, owner, target, isCustomElement, false, conditional)), styling];
}

/**
 * Maps the `class` or the `style` of an element, its string and the keys it binds one by one, to one descriptor
 * `_renderElement` applies like the ones of its attributes (see `_RenderStyling` of the runtime): `_setStyling` for a
 * static string alone, `_setExpressionStyling` once for expressions reading no name, otherwise a binding of the scope
 * (`_setReactiveStyling`), keeping its element and the values computed last in its slots, with the names of the
 * variables of the template its expressions read. Inside a conditional binding it is removed when its branch is no
 * longer the selected one.
 *
 * N.B. Deliberate, to save memory: one descriptor and one binding for the whole attribute instead of one per class or
 * property, so that an element keeps one effect and three slots. Do not map a binding per key again.
 *
 * @param attribute - The attribute.
 * @param string - The attribute holding the string, if any.
 * @param keys - The keys bound one by one.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param conditional - Whether the bindings are declared inside a conditional binding.
 * @returns The code of the descriptor, `undefined` when the element writes nothing on the attribute.
 */
function mapStyling(attribute: 'class' | 'style', string: AttributeNode | undefined, keys: ReadonlyArray<ClassBindingNode | StyleBindingNode>, owner: DescriptorOwner, conditional: boolean): string | undefined {
  const { generatorContext } = owner;
  const found: StylingExpressions = { count: 0, constant: true, variables: undefined };
  const members = describeStyling(attribute, string, keys, (role, expression) => declareStylingExpression(owner, role, expression, found));
  if (!members) {
    return undefined;
  }

  if (found.count && !found.constant) {
    const reads = generatorContext.getReads(found.variables);
    members.push('setter: _setReactiveStyling');
    appendReads(members, reads);
    appendStylingUnbind(members, conditional);
    return generatorContext.declareBinding(`${owner.name}$${attribute}$binding`, members, '_setExpressionStyling', true, true) ?? toObjectLiteral(members);
  }

  members.push(`setter: ${found.count ? '_setExpressionStyling' : '_setStyling'}`);
  appendStylingUnbind(members, conditional);
  return toObjectLiteral(members);
}

/**
 * Declares the function of the module computing an expression of the `class` or of the `style` of an element,
 * collecting whether the expressions read a name, and the variables of the template they read.
 *
 * @param owner - The element.
 * @param role - The role the function is named after.
 * @param expression - The expression.
 * @param found - Collects what the expressions read.
 * @returns The name of the function.
 */
function declareStylingExpression(owner: DescriptorOwner, role: string, expression: Expression, found: StylingExpressions): string {
  const resolved = resolveExpression(expression, owner.generatorContext);
  found.count++;
  found.constant &&= isConstantExpression(expression);
  found.variables = joinVariables(found.variables, resolved.variables);
  return declareElementExpression(owner, role, resolved.expression);
}

/**
 * Appends the unbind of a descriptor of `class` or `style` declared inside a conditional binding.
 *
 * @param members - The members of the descriptor.
 * @param conditional - Whether it is declared inside a conditional binding.
 */
function appendStylingUnbind(members: string[], conditional: boolean): void {
  if (conditional) {
    members.push('unbind: _removeStyling');
  }
}

/**
 * Flags the states merging the sources of the `class` and of the `style` of an element the runtime creates before
 * applying its bindings (see `_prepareStyling` of the runtime), for an attribute the element writes:
 * - `1` (`class`) and `2` (`style`) when another source of the template writes it, or may: a branch of one of its
 *   conditional bindings writing it or applying directives, or, for an element applying structural directives, whose
 *   bindings the runtime keeps without slots, always;
 * - `4` and `8` when a source outside the template may write it: the component the element is, or a directive it
 *   applies, which the runtime checks.
 *
 * N.B. Deliberate, to save memory: an element written by its template alone, nearly every one, gets no flag, so that
 * the runtime creates no state for it. Do not flag every element.
 *
 * @param node - The element.
 * @param writes - What the element writes itself: `1` for `class`, `2` for `style`.
 * @param structural - Whether it applies structural directives.
 * @returns The flags, `0` for none.
 */
function stylingFlags(node: ElementNode, writes: number, structural: boolean): number {
  if (!writes) {
    return 0;
  }

  const branches = branchStyling(node.conditionalBindings);
  let flags = structural || branches & 4 ? writes : writes & branches;
  if (isValidCustomElementName(node.tagName, false) || node.directives.length) {
    flags |= (writes & ~flags) << 2;
  }

  return flags;
}

/**
 * Tells which of `class` and `style` a branch writes itself, by its bindings: a `class` an input of the component takes
 * counts too, which only makes the runtime create a state it needs not.
 *
 * @param bindings - The branch.
 * @returns `1` for `class`, `2` for `style`, both, `0` for none.
 */
function writtenStyling({ attributes, classBindings, styleBindings }: Pick<ElementNode, 'attributes' | 'classBindings' | 'styleBindings'>): number {
  let flags = classBindings.length ? 1 : 0;
  if (styleBindings.length) {
    flags |= 2;
  }

  for (let i = 0; i < attributes.length; i++) {
    switch (attributes[i].name) {
      case 'class':
        flags |= 1;
        break;

      case 'style':
        flags |= 2;
        break;
    }
  }

  return flags;
}

/**
 * Tells what the branches of conditional bindings, nested ones included, write: `1` `class`, `2` `style`, `4` the
 * directives they apply.
 *
 * @param conditionalBindings - The conditional bindings.
 * @returns The flags.
 */
function branchStyling(conditionalBindings: ConditionalBindingNode[]): number {
  let flags = 0;
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      const branch = branches[j];
      flags |= writtenStyling(branch) | branchStyling(branch.conditionalBindings);
      if (branch.directives.length) {
        flags |= 4;
      }
    }
  }

  return flags;
}

/**
 * Appends to the members of a descriptor the constant listing the variables of the template its value reads, if any.
 *
 * @param members - The members of the descriptor.
 * @param reads - The name of the constant, `undefined` when the value reads no variable.
 */
function appendReads(members: string[], reads: string | undefined): void {
  if (reads) {
    members.push(`reads: ${reads}`);
  }
}

/**
 * Generates the descriptors of the event listeners of a DOM element.
 *
 * The handler of each descriptor is a function of the module named after the element and the event (`td0$on_click`),
 * making the whole call of the template, with the method and its arguments resolved like any other expression: a method
 * of a member (`cart.clear()`) is called on that member. The runtime calls it with the component, the context of the
 * scope declaring the listener and the native event, which the function declares as `$event` when an argument reads it,
 * whole or in part (`$event.target`).
 *
 * A key event (`(keydown.enter)="save()"`) is listened to as its event, `keydown`, whose handler makes the call only for
 * its key: `if (_isKey($event, 'enter', 0)) this.save();`. A key event making the same call as the last listener of its
 * event in the list, filtered too, joins it, its key added to the condition: `(keydown.enter)="save()"
 * (keydown.escape)="save()"` is one listener, calling `save()` for either key.
 *
 * N.B. Deliberate, to save memory: the keys of the listeners joined are tested by one handler, so that every element
 * keeps one listener, and the element one registration, instead of one per key. A key event names one key, with
 * exactly its modifiers, so the listeners joined would never both have called it for the same event; only the last
 * listener of the event is joined, so that the listeners of an event are called in the order they are written. Do not
 * join a listener without filter, nor listeners making different calls.
 *
 * @param events - The event nodes to bind to the element.
 * @param owner - The element, which the functions of the handlers are named after.
 * @param prefix - The part of the name of the functions telling what declares the events: the selector of a directive
 *   followed by `_`, empty for the element.
 * @returns The code of the descriptors, one per event listener.
 */
function mapEvents(events: EventNode[], owner: DescriptorOwner, prefix = ''): string[] {
  const { generatorContext } = owner;
  // The listeners of a branch rendered inline are kept by a slot of the branch
  if (events.length) {
    generatorContext.reserveCleanup();
  }

  generatorContext.addUnresolvableIdentifier('$event');

  const listeners = new Array<TemplateListenerCode>();
  // The last listener of each event, which a key event making the same call joins
  const lastListeners = new Map<string, TemplateListenerCode>();
  for (let i = 0; i < events.length; i++) {
    const { name, handler, parameters, key } = events[i];
    const method = resolveHandler(handler, generatorContext);
    const args = parameters.map(parameter => resolveExpression(parameter, generatorContext).expression).join(', ');
    const call = `${method}(${args})`;
    const event = key?.event ?? name;
    const last = lastListeners.get(event);
    if (key && last?.keys && last.call === call) {
      last.keys.push(toKeyCondition(key));
      last.role = `${last.role}_${toRoleName(name.slice(event.length + 1))}`;
      continue;
    }

    const listener: TemplateListenerCode = { event, call, role: toRoleName(name), readsEvent: parameters.some(readsEvent) };
    if (key) {
      listener.keys = [toKeyCondition(key)];
    }

    listeners.push(listener);
    lastListeners.set(event, listener);
  }

  const mappedEvents = listeners.map(({ event, call, role, readsEvent: passesEvent, keys }) => {
    const body = keys ? `if (${keys.join(' || ')}) ${call};` : `${call};`;
    const declared = generatorContext.declareFunction(`${owner.name}$${prefix}on_${role}`, keys || passesEvent ? 'context, $event' : 'context', [body]);
    return toObjectLiteral([`name: '${event}'`, `handler: ${declared}`]);
  });

  generatorContext.removeUnresolvabledIdentifier('$event');
  return mappedEvents;
}

/**
 * Writes the test of the key of a key event the handler of its listener makes (see `_isKey` of the runtime).
 *
 * @param key - The key the listener is filtered by.
 * @returns The code of the test, e.g. `_isKey($event, 'enter', 0)`.
 */
function toKeyCondition({ key, modifiers, code }: KeyEventFilter): string {
  return `_isKey($event, ${toStringLiteral(key)}, ${modifiers}${code ? ', true' : ''})`;
}

/**
 * Resolves the method an event binding calls.
 *
 * A handler starting with a reserved word (`delete()`, `new()`, `void()`) is a method of the component: no variable
 * of the template can have that name. As an expression it would be read as an operator, so it is validated as the
 * name of a property, which a reserved word can be, and called on the component.
 *
 * @param handler - The handler of the event binding, as written before its parenthesis.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns The expression of the method to call.
 * @throws If the handler is not a valid expression.
 */
function resolveHandler(handler: string, generatorContext: GeneratorContext): string {
  const keyword = identifierToKeywordKind(factory.createIdentifier(handler.split(/\?\.|[.[]/)[0]));
  if (keyword !== undefined && keyword >= SyntaxKind.FirstReservedWord && keyword <= SyntaxKind.LastReservedWord) {
    validateExpression(`x.${handler}`);
    return `this.${handler}`;
  }

  return resolveExpression(validateExpression(handler).node, generatorContext).expression;
}

/**
 * Maps conditional binding nodes to the descriptors `_renderElement` binds: the branches of the conditional
 * binding and, for a `@switch`, the expression whose value selects the branch to apply.
 *
 * Conditional bindings whose branches declare no binding at all are skipped. The structural directives are left out,
 * since they are applied through the descriptors generated by {@link mapStructuralConditionalBindings}.
 *
 * @param conditionalBindings - The conditional binding nodes to map.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param target - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the conditional bindings are declared in.
 * @param isCustomElement - Whether the target is a custom element.
 * @param isDirective - Whether the target is a directive.
 * @returns The code of the descriptors, one per conditional binding.
 */
async function mapConditionalBindings(conditionalBindings: ConditionalBindingNode[], owner: DescriptorOwner, target: string, isCustomElement = false, isDirective = false): Promise<string[]> {
  return mapConditionalBindingDescriptors(conditionalBindings, owner, isEmptyBranch, (branch, condition, branchOwner) => mapBranch(branch, condition, branchOwner, target, isCustomElement, isDirective));
}

/**
 * Maps the conditional binding nodes declared on an element to the descriptors of the conditional bindings applying
 * its structural directives: the branches of the conditional binding, holding only the structural directives and the
 * nested conditional bindings applying them, and, for a `@switch`, the expression whose value selects the branch to apply.
 *
 * Conditional bindings whose branches apply no structural directive at all, neither directly nor through their nested
 * conditional bindings, are skipped.
 *
 * @param conditionalBindings - The conditional binding nodes to map.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptors, one per conditional binding.
 */
async function mapStructuralConditionalBindings(conditionalBindings: ConditionalBindingNode[], owner: DescriptorOwner): Promise<string[]> {
  return mapConditionalBindingDescriptors(conditionalBindings, owner, branch => !appliesStructuralDirectives(branch), (branch, condition, branchOwner) => mapStructuralBranch(branch, condition, branchOwner));
}

/**
 * Maps conditional binding nodes to descriptors: the branches of the conditional binding, each one mapped by `mapBranch`,
 * and, for a `@switch`, the expression whose value selects the branch to apply, and the identifiers of the variables of
 * the template the conditions or the expression read, if any. The conditions and the expression are functions of the
 * module named after the element (`div0$if`, `div0$switch`).
 *
 * The runtime evaluates the conditions, the expression and the bindings of the branches in the scope of the branch, a
 * child of the scope the conditional binding is bound in (see `bindConditionalBindings` of the runtime): they are
 * resolved in a generator context standing for it, one more scope up the chain for each conditional binding nesting it.
 *
 * @param conditionalBindings - The conditional binding nodes to map.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param isEmpty - Tells whether a branch has nothing to apply: a conditional binding whose branches all have nothing to apply is skipped.
 * @param mapBranch - Maps a branch, given the member declaring its condition, if any, and the owner standing for the scope
 *   of the branch, to its descriptor.
 * @returns The code of the descriptors, one per conditional binding.
 */
async function mapConditionalBindingDescriptors(
  conditionalBindings: ConditionalBindingNode[],
  owner: DescriptorOwner,
  isEmpty: Function<[branch: ConditionalBindingBranchNode], boolean>,
  mapBranch: AsyncFunction<[branch: ConditionalBindingBranchNode, condition: string | undefined, branchOwner: DescriptorOwner], string>
): Promise<string[]> {
  const mappedConditionalBindings = new Array<string>();

  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    const { branches } = conditionalBinding;
    if (branches.every(isEmpty)) {
      continue;
    }

    const branchOwner: DescriptorOwner = { name: owner.name, generatorContext: new GeneratorContext(owner.generatorContext, undefined, 'runtime') };
    const mappedBranches = new Array<string>();
    const variables: { read?: readonly number[] } = {};
    for (let j = 0; j < branches.length; j++) {
      mappedBranches.push(await mapBranch(branches[j], mapCondition(conditionalBinding, j, branchOwner, variables), branchOwner));
    }

    const members = new Array<string>();
    if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
      const { expression, variables: read } = resolveExpression(conditionalBinding.expression, branchOwner.generatorContext);
      variables.read = read;
      members.push(`expression: ${declareElementExpression(branchOwner, 'switch', expression)}`);
    }

    members.push(`branches: ${toArrayLiteral(mappedBranches)}`);
    const reads = owner.generatorContext.getReads(variables.read);
    appendReads(members, reads);
    // The selection is a binding of the scope holding the conditional binding, writing the run applying the branches
    mappedConditionalBindings.push(owner.generatorContext.declareBinding(`${owner.name}$conditional$binding`, members, '_runConditionalBinding', !!reads) ?? toObjectLiteral(members));
  }

  return mappedConditionalBindings;
}

/**
 * Tells whether a branch of a conditional binding declares no binding at all, apart from structural directives:
 * neither directly nor through its nested conditional bindings.
 *
 * @param branch - The branch to check.
 * @returns `true` if the branch has nothing to apply, `false` otherwise.
 */
function isEmptyBranch({ attributes, classBindings, styleBindings, events, conditionalBindings, directives }: ConditionalBindingBranchNode): boolean {
  return !attributes.length && !classBindings.length && !styleBindings.length && !events.length && !directives.length && conditionalBindings.every(({ branches }) => branches.every(isEmptyBranch));
}

/**
 * Tells whether a branch of a conditional binding applies any structural directive,
 * either directly or through its nested conditional bindings.
 *
 * @param branch - The branch to check.
 * @returns `true` if the branch applies a structural directive, `false` otherwise.
 */
function appliesStructuralDirectives({ structuralDirectives, conditionalBindings }: ConditionalBindingBranchNode): boolean {
  return !!structuralDirectives.length || conditionalBindings.some(({ branches }) => branches.some(appliesStructuralDirectives));
}

/**
 * Maps what selects a branch of a conditional binding: the condition of an `@if` or `@else if` branch, a function of
 * the module resolved against the current scope, or the values of the `@case`s of a `@switch` branch, emitted as
 * declared.
 *
 * A branch selected when no other one is has no condition to evaluate:
 * an `@else` branch doesn't declare the condition at all, a `@default` one declares a `null` one.
 *
 * @param conditionalBinding - The conditional binding node the branch belongs to.
 * @param index - The index of the branch among the ones of the conditional binding.
 * @param owner - The element, which the functions of the conditions are named after.
 * @param variables - Collects the variables of the template the conditions read.
 * @returns The member declaring the condition of the branch, `undefined` for an `@else`.
 */
function mapCondition(conditionalBinding: ConditionalBindingNode, index: number, owner: DescriptorOwner, variables: { read?: readonly number[] }): string | undefined {
  if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
    const { condition } = conditionalBinding.branches[index];
    return `condition: ${condition ? `[${condition.join(', ')}]` : 'null'}`;
  }

  const { condition } = conditionalBinding.branches[index];
  if (!condition) {
    return undefined;
  }

  const resolved = resolveExpression(condition, owner.generatorContext);
  variables.read = joinVariables(variables.read, resolved.variables);
  return `condition: ${declareElementExpression(owner, 'if', resolved.expression)}`;
}

/**
 * Maps a branch of a conditional binding to the descriptor of the bindings `_renderElement` applies while
 * the branch is selected: the attributes, the events, the nested conditional bindings and, for a conditional
 * binding declared on an element, the directives. The lists the branch does not declare are left out.
 *
 * @param branch - The branch node to map.
 * @param condition - The member declaring the condition of the branch, if any.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param target - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the branch is declared in.
 * @param isCustomElement - Whether the target is a custom element.
 * @param isDirective - Whether the target is a directive.
 * @returns The code of the descriptor of the branch.
 */
async function mapBranch(branch: ConditionalBindingBranchNode, condition: string | undefined, owner: DescriptorOwner, target: string, isCustomElement: boolean, isDirective: boolean): Promise<string> {
  const { events, conditionalBindings, directives } = branch;
  const members = condition ? [condition] : new Array<string>();
  const [attributes, styling] = await mapBindings(branch, owner, target, isCustomElement, isDirective, true);
  appendList(members, 'attributes', attributes);
  // A branch writing `class` or `style` is a source that comes and goes, merged by the state of the element
  if (styling) {
    members.push(`styling: ${styling}`);
  }

  appendList(members, 'events', mapEvents(events, owner, isDirective ? `${toRoleName(target.slice(2))}_` : ''));
  appendList(members, 'conditionalBindings', await mapConditionalBindings(conditionalBindings, owner, target, isCustomElement, isDirective));

  // A conditional binding declared inside a directive cannot apply other directives
  if (!isDirective) {
    appendList(members, 'directives', await mapDirectives(directives, owner));
  }

  return toObjectLiteral(members);
}

/**
 * Maps directive nodes to the descriptors `_renderElement` applies to the element:
 * the directive selector, its properties, its events and its conditional bindings, the lists it does not declare left
 * out.
 *
 * Properties bound directly in the directive are never unbound, since they live as long as the directive.
 *
 * @param directives - The directive nodes applied to the element.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptors, one per directive.
 */
async function mapDirectives(directives: DirectiveNode[], owner: DescriptorOwner): Promise<string[]> {
  const mappedDirectives = new Array<string>();

  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];
    const { selector, attributes, events, conditionalBindings } = directive;
    const members = [`selector: '${selector}'`];
    const order = getDirectiveOrder(directive);
    if (order) {
      members.push(`order: ${order}`);
    }

    appendList(members, 'attributes', await mapAttributes(attributes, owner, `@@${selector}`, false, true, false));
    appendList(members, 'events', mapEvents(events, owner, `${toRoleName(selector)}_`));
    appendList(members, 'conditionalBindings', await mapConditionalBindings(conditionalBindings, owner, `@@${selector}`, false, true));
    mappedDirectives.push(toObjectLiteral(members));
  }

  return mappedDirectives;
}

/**
 * Maps a branch of a conditional binding declared on an element to the descriptor of the structural directives
 * `_renderElement` applies while the branch is selected: the structural directives and the nested conditional
 * bindings applying them.
 *
 * @param branch - The branch node to map.
 * @param condition - The member declaring the condition of the branch, if any.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptor of the branch.
 */
async function mapStructuralBranch(branch: ConditionalBindingBranchNode, condition: string | undefined, owner: DescriptorOwner): Promise<string> {
  const members = condition ? [condition] : new Array<string>();
  appendList(members, 'structuralDirectives', await mapStructuralDirectives(branch.structuralDirectives, owner));
  appendList(members, 'conditionalBindings', await mapStructuralConditionalBindings(branch.conditionalBindings, owner));
  return toObjectLiteral(members);
}

/**
 * Maps structural directive nodes to the descriptors `_renderElement` applies to decide whether the element is rendered:
 * the directive selector and its properties.
 *
 * Properties are never unbound, since they live as long as the structural directive and cannot be bound conditionally.
 *
 * @param structuralDirectives - The structural directive nodes applied to the element.
 * @param owner - The element, which the functions of the expressions are named after.
 * @returns The code of the descriptors, one per structural directive.
 */
async function mapStructuralDirectives(structuralDirectives: StructuralDirectiveNode[], owner: DescriptorOwner): Promise<string[]> {
  const mappedStructuralDirectives = new Array<string>();

  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    const members = [`selector: '${selector}'`];
    appendList(members, 'attributes', await mapAttributes(attributes, owner, `@@${selector}`, false, true, false));
    mappedStructuralDirectives.push(toObjectLiteral(members));
  }

  return mappedStructuralDirectives;
}
