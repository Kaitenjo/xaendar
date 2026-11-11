import { isValidCustomElementName } from '@xaendar/common';
import type { AsyncFunction, Function } from '@xaendar/types';
import { factory, identifierToKeywordKind, SyntaxKind } from 'typescript';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../../parser/types/nodes/class-binding-node.type';
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
import { GeneratorContext } from '../../context/context';
import type { DescriptorOwner } from '../../types/descriptor-owner.type';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getElementIdentifier, isConstantExpression, joinVariables, resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';
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
 * out.
 *
 * The children are rendered by `_renderElement` through the function the constant names, since an element applying
 * structural directives is created, and created again, by the runtime only while they allow it: it receives the context
 * the children are rendered in, whose strategy gets their nodes, created or adopted from the HTML rendered on the server.
 * The classes the element toggles come before its attributes, so that writing `class` finds them, and an element adopted
 * holding the same classes is not written.
 * The conditional bindings declared on the element are split in two lists: the descriptors of the element bindings
 * leave out the structural directives, the ones of the structural conditional bindings keep only them.
 *
 * @param node - The `ElementNode` to process.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param index - The position of the element among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The node the element is rendered before, `null` to append it.
 * @returns The generated code and the function rendering the children, if any.
 */
export async function generateElement(node: ElementNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const tagName = node.tagName;
  const nodeName = getElementIdentifier(node, parentNode, index);
  // A custom element of another library has no metadata: it is generated like a native element
  const isCustomElement = isValidCustomElementName(tagName, false) && !generatorContext.isForeignElement(tagName);
  const owner: DescriptorOwner = { name: nodeName, generatorContext };
  const attributes = mapClassBindings(node.classBindings, owner, false).concat(await mapAttributes(node.attributes, owner, tagName, isCustomElement, false, false));
  const events = mapEvents(node.events, owner);
  const conditionalBindings = await mapConditionalBindings(node.conditionalBindings, owner, tagName, isCustomElement);
  const directives = await mapDirectives(node.directives, owner);
  const structuralDirectives = await mapStructuralDirectives(node.structuralDirectives, owner);
  const structuralConditionalBindings = await mapStructuralConditionalBindings(node.conditionalBindings, owner);
  const hasChildren = !!node.children.length;
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  /*
    Remove the if would create an empty line in the generated code
    when the precode is empty, it avoids adding unnecessary blank line.
  */
  const precode = overrideCreateElement(tagName);
  if (precode) {
    retVal.code.push(precode);
  }

  const members = [`tagName: '${tagName}'`];
  appendList(members, 'attributes', attributes);
  appendList(members, 'events', events);
  appendList(members, 'conditionalBindings', conditionalBindings);
  appendList(members, 'directives', directives);
  appendList(members, 'structuralDirectives', structuralDirectives);
  appendList(members, 'structuralConditionalBindings', structuralConditionalBindings);
  if (hasChildren) {
    members.push(`children: ${nodeName}Children`);
  }

  // The element ref naming the element, declared by its scope, is initialized once the element is created
  if (node.ref) {
    members.push(`ref: '${node.ref.name}'`);
  }

  const element = generatorContext.declareConstant(`${nodeName}$element`, toObjectLiteral(members));
  retVal.code.push(`_renderElement(${parentNode}, context, ${anchor}, ${element});`);

  switch (tagName) {
    case 'svg':
    case 'math':
      retVal.code.push('context.createElement = _createElement;');
  }

  if (hasChildren) {
    const childrenNamespace = getChildrenNamespace(tagName, getElementNamespace(tagName, generatorContext.namespace));
    retVal.functionsToProcess!.set(`${nodeName}Children`, {
      fn: {
        node,
        parentNode: nodeName,
        /*
          The content of an element a structural directive is applied to is a scope of its own, created and destroyed with
          it, and the children of an element opening a namespace are created in it
        */
        context: isStructuralElement(node) || childrenNamespace !== generatorContext.namespace ? new GeneratorContext(generatorContext, childrenNamespace) : generatorContext,
        precode: overrideChildrenCreateElement(tagName)
      },
      // The function takes the context of the element instead, when it renders the children in it (see `Generator`)
      args: [nodeName, 'parentContext']
    });
  }

  return retVal;
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
 * @throws If the metadata of a directive property can't be resolved.
 */
async function mapAttributes(attributes: AttributeNode[], owner: DescriptorOwner, target: string, isCustomElement: boolean, isDirective: boolean, conditional: boolean): Promise<string[]> {
  const mappedAttributes = new Array<string>();
  const { generatorContext } = owner;
  // Native elements have no metadata
  const metadata = attributes.length && (isCustomElement || isDirective) ? await generatorContext.cache?.getOrInsert(target) : undefined;
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    const input = metadata?.properties.get(name);
    if (isDirective && !input) {
      // Unlike components, a non-recognized property cannot be applied as an attribute on the DOM element itself
      throw new Error(`Unable to resolve the metadata of property "${name}" of ${target}`, { cause: attributes[i].span });
    }

    const property = input && !input.exposed ? input.name : name;
    const members = [`name: '${property}'`];
    if (typeof value === 'string') {
      members.push(`value: ${toStringLiteral(value)}`, `setter: ${input ? '_setInput' : '_setProperty'}`);
    } else {
      const { expression, variables } = resolveExpression(value.expression, generatorContext);
      const setter = isConstantExpression(value.expression)
        ? input ? '_setExpressionInput' : '_setExpressionProperty'
        : input ? '_setReactiveInput' : '_setReactiveProperty';
      const role = isDirective ? `${toRoleName(target.slice(2))}_${toRoleName(property)}` : toRoleName(property);
      members.push(`value: ${declareElementExpression(owner, role, expression)}`, `setter: ${setter}`);
      appendReads(members, generatorContext.getReads(variables));
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

    mappedAttributes.push(toObjectLiteral(members));
  }

  return mappedAttributes;
}

/**
 * Maps the classes an element toggles to descriptors `_renderElement` applies like the ones of its attributes, with a
 * setter toggling the class instead of setting an attribute: once for a value reading no name, as a binding otherwise,
 * with the names of the variables of the template it reads. The value is a function of the module named after the
 * element and the class (`td0$class_active`).
 *
 * A class toggled inside a conditional binding is also removed when its branch is no longer the selected one.
 *
 * @param classBindings - The class binding nodes of the element, or of a branch of one of its conditional bindings.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param conditional - Whether the class bindings are declared inside a conditional binding.
 * @returns The code of the descriptors, one per class.
 */
function mapClassBindings(classBindings: ClassBindingNode[], owner: DescriptorOwner, conditional: boolean): string[] {
  const mappedAttributes = new Array<string>();
  for (let i = 0; i < classBindings.length; i++) {
    const { className, value } = classBindings[i];
    const { expression, variables } = resolveExpression(value.expression, owner.generatorContext);
    const members = [
      `name: ${toStringLiteral(className)}`,
      `value: ${declareElementExpression(owner, `class_${toRoleName(className)}`, expression)}`,
      `setter: ${isConstantExpression(value.expression) ? '_setExpressionClass' : '_setReactiveClass'}`
    ];
    appendReads(members, owner.generatorContext.getReads(variables));
    if (conditional) {
      members.push('unbind: _removeClass');
    }

    mappedAttributes.push(toObjectLiteral(members));
  }

  return mappedAttributes;
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
 * @param events - The event nodes to bind to the element.
 * @param owner - The element, which the functions of the handlers are named after.
 * @param prefix - The part of the name of the functions telling what declares the events: the selector of a directive
 *   followed by `_`, empty for the element.
 * @returns The code of the descriptors, one per event listener.
 */
function mapEvents(events: EventNode[], owner: DescriptorOwner, prefix = ''): string[] {
  const { generatorContext } = owner;
  generatorContext.addUnresolvableIdentifier('$event');

  const mappedEvents = events.map(({ name, handler, parameters }) => {
    const method = resolveHandler(handler, generatorContext);
    const args = parameters.map(parameter => resolveExpression(parameter, generatorContext).expression).join(', ');
    const parametersOfHandler = parameters.some(readsEvent) ? 'context, $event' : 'context';
    const declared = generatorContext.declareFunction(`${owner.name}$${prefix}on_${toRoleName(name)}`, parametersOfHandler, [`${method}(${args});`]);
    return toObjectLiteral([`name: '${name}'`, `handler: ${declared}`]);
  });

  generatorContext.removeUnresolvabledIdentifier('$event');
  return mappedEvents;
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
  return mapConditionalBindingDescriptors(conditionalBindings, owner, isEmptyBranch, (branch, condition) => mapBranch(branch, condition, owner, target, isCustomElement, isDirective));
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
  return mapConditionalBindingDescriptors(conditionalBindings, owner, branch => !appliesStructuralDirectives(branch), (branch, condition) => mapStructuralBranch(branch, condition, owner));
}

/**
 * Maps conditional binding nodes to descriptors: the branches of the conditional binding, each one mapped by `mapBranch`,
 * and, for a `@switch`, the expression whose value selects the branch to apply, and the names of the variables of the
 * template the conditions or the expression read, if any. The conditions and the expression are functions of the module
 * named after the element (`div0$if`, `div0$switch`).
 *
 * @param conditionalBindings - The conditional binding nodes to map.
 * @param owner - The element, which the functions of the expressions are named after.
 * @param isEmpty - Tells whether a branch has nothing to apply: a conditional binding whose branches all have nothing to apply is skipped.
 * @param mapBranch - Maps a branch, given the member declaring its condition, if any, to its descriptor.
 * @returns The code of the descriptors, one per conditional binding.
 */
async function mapConditionalBindingDescriptors(
  conditionalBindings: ConditionalBindingNode[],
  owner: DescriptorOwner,
  isEmpty: Function<[branch: ConditionalBindingBranchNode], boolean>,
  mapBranch: AsyncFunction<[branch: ConditionalBindingBranchNode, condition: string | undefined], string>
): Promise<string[]> {
  const mappedConditionalBindings = new Array<string>();

  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    const { branches } = conditionalBinding;
    if (branches.every(isEmpty)) {
      continue;
    }

    const mappedBranches = new Array<string>();
    const variables: { read?: readonly string[] } = {};
    for (let j = 0; j < branches.length; j++) {
      mappedBranches.push(await mapBranch(branches[j], mapCondition(conditionalBinding, j, owner, variables)));
    }

    const members = new Array<string>();
    if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
      const { expression, variables: read } = resolveExpression(conditionalBinding.expression, owner.generatorContext);
      variables.read = read;
      members.push(`expression: ${declareElementExpression(owner, 'switch', expression)}`);
    }

    members.push(`branches: ${toArrayLiteral(mappedBranches)}`);
    appendReads(members, owner.generatorContext.getReads(variables.read));
    mappedConditionalBindings.push(toObjectLiteral(members));
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
function isEmptyBranch({ attributes, classBindings, events, conditionalBindings, directives }: ConditionalBindingBranchNode): boolean {
  return !attributes.length && !classBindings.length && !events.length && !directives.length && conditionalBindings.every(({ branches }) => branches.every(isEmptyBranch));
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
function mapCondition(conditionalBinding: ConditionalBindingNode, index: number, owner: DescriptorOwner, variables: { read?: readonly string[] }): string | undefined {
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
  const { attributes, classBindings, events, conditionalBindings, directives } = branch;
  const members = condition ? [condition] : new Array<string>();
  appendList(members, 'attributes', mapClassBindings(classBindings, owner, true).concat(await mapAttributes(attributes, owner, target, isCustomElement, isDirective, true)));
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
    const { selector, attributes, events, conditionalBindings } = directives[i];
    const members = [`selector: '${selector}'`];
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

/**
 * Returns the code switching the element factory of the context to the namespace an element opens:
 * an `<svg>` and a `<math>` element, and their descendants, are created in the SVG and the MathML namespace.
 *
 * @param tagName - The tag name of the element.
 * @returns The code assigning the element factory, or an empty string when the element does not change namespace.
 */
function overrideCreateElement(tagName: string): string {
  switch (tagName) {
    case 'svg':
      return 'context.createElement = _createSVGElement;';
    case 'math':
      return 'context.createElement = _createMATHMLElement;';
    default:
      return '';
  }
}

/**
 * Returns the code switching the element factory of the context rendering the children of an element to their namespace:
 * the namespace the element opens (see {@link overrideCreateElement}), or the HTML one for the children of a
 * `<foreignObject>`, which embeds HTML in an SVG.
 *
 * @param tagName - The tag name of the element.
 * @returns The code assigning the element factory, or an empty string when the children keep the namespace of the element.
 */
function overrideChildrenCreateElement(tagName: string): string {
  switch (tagName) {
    case 'foreignObject':
      return 'context.createElement = _createElement;';
    default:
      return overrideCreateElement(tagName);
  }
}
