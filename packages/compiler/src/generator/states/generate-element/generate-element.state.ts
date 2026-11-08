import { indent, isValidCustomElementName } from '@xaendar/common';
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
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getElementIdentifier, resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';

/**
 * Generates code for an HTML element node: creates the DOM element, sets attributes,
 * attaches event listeners, applies conditional bindings and directives, appends it to the parent,
 * and recursively processes children.
 *
 * The children are rendered by `_renderElement` through the function passed as last argument, since an element applying
 * structural directives is created, and created again, by the runtime only while they allow it: it receives the strategy
 * getting the nodes of the children, created or adopted from the HTML rendered on the server.
 * The classes the element toggles come before its attributes, so that writing `class` finds them, and an element adopted
 * holding the same classes is not written.
 * The conditional bindings declared on the element are split in two lists: the descriptors of the element bindings
 * leave out the structural directives, the ones of the structural conditional bindings keep only them.
 *
 * @param node - The `ElementNode` to process.
 * @param index - Variable name to use for the created DOM element.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param generatorContext - Current render scope context.
 * @returns Array of generated code lines.
 */
export async function generateElement(node: ElementNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const tagName = node.tagName;
  // A custom element of another library has no metadata: it is generated like a native element
  const isCustomElement = isValidCustomElementName(tagName, false) && !generatorContext.isForeignElement(tagName);
  const attributes = mapClassBindings(node.classBindings, generatorContext, false).concat(await mapAttributes(node.attributes, generatorContext, tagName, isCustomElement, false, false));
  const events = mapEvents(node.events, generatorContext);
  const conditionalBindings = await mapConditionalBindings(node.conditionalBindings, generatorContext, tagName, isCustomElement);
  const directives = await mapDirectives(node.directives, generatorContext);
  const structuralDirectives = await mapStructuralDirectives(node.structuralDirectives, generatorContext);
  const structuralConditionalBindings = await mapStructuralConditionalBindings(node.conditionalBindings, generatorContext);
  const hasChildren = !!node.children.length;
  const nodeName = getElementIdentifier(node, parentNode, index);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  }

  /*
    Remove the if would create an empty line in the generated code
    when the precode is empty, it avoids adding unnecessary blank line.
  */
  const precode = overrideCreateElement(tagName);
  if (precode) {
    retVal.code.push(precode);
  }

  retVal.code.push(`_renderElement(${parentNode}, context, ${anchor}, '${tagName}',`);

  const members = [attributes, events, conditionalBindings, directives, structuralDirectives, structuralConditionalBindings];
  for (let i = 0; i < members.length; i++) {
    appendArgument(retVal.code, members[i]);
  }

  // The element ref naming the element, declared by its scope, follows the children
  const ref = node.ref ? `, '${node.ref.name}'` : '';
  hasChildren
    ? retVal.code.push(
      indent(`(${nodeName}, parentContext, nodeStrategy) => ${nodeName}Children.call(this, ${nodeName}, parentContext, nodeStrategy)${ref}`),
      ');'
    )
    : retVal.code[retVal.code.length - 1] = `${retVal.code[retVal.code.length - 1]} null${ref});`;

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
      args: [nodeName, 'parentContext', 'nodeStrategy']
    });
  }

  return retVal;
}

/**
 * Appends a list argument of the `_renderElement` call being generated: an array literal holding the given lines,
 * or an empty array literal appended to the last line when there are none.
 *
 * @param code - The generated code lines, ending with the part of the call generated so far.
 * @param lines - The lines of the elements of the array.
 */
function appendArgument(code: string[], lines: string[]): void {
  lines.length
    ? code.push(
      ...indent([
        '[',
        ...indent(lines),
        '],'
      ])
    )
    : code[code.length - 1] = `${code[code.length - 1]} [],`;
}

/**
 * Maps attribute nodes to their corresponding generated code lines.
 *
 * An input of a component or of a directive, known from the metadata of its owner, is set by the name of its property,
 * never by its alias, the one it is exposed with for an input of a host directive, through the setters of the inputs:
 * an element whose class is not defined yet, e.g. one of a component loaded lazily, holds the value until the class
 * recovers it. Every attribute of a directive is one of its inputs, since a directive has no underlying attribute.
 * Attributes declared inside a conditional binding also get the `unbind` applied when their
 * branch is no longer the selected one: a property of a custom element or of a directive, known from
 * the metadata of its owner, is reset at runtime to the default value its owner declares, any other
 * attribute is removed.
 * A required property gets no `unbind`, since the branch selected next binds it again.
 *
 * @param attributes - The attribute nodes to map onto the element or the directive.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @param owner - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the attributes are bound to.
 * @param isCustomElement - Whether the owner is a custom element.
 * @param isDirective - Whether the owner is a directive.
 * @param conditional - Whether the attributes are declared inside a conditional binding.
 * @returns Array of generated code strings, one per attribute.
 * @throws If the metadata of a directive property can't be resolved.
 */
async function mapAttributes(attributes: AttributeNode[], generatorContext: GeneratorContext, owner: string, isCustomElement: boolean, isDirective: boolean, conditional: boolean): Promise<string[]> {
  const mappedAttributes = new Array<string>();
  // Native elements have no metadata
  const metadata = attributes.length && (isCustomElement || isDirective) ? await generatorContext.cache?.getOrInsert(owner) : undefined;
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    const input = metadata?.properties.get(name);
    if (isDirective && !input) {
      // Unlike components, a non-recognized property cannot be applied as an attribute on the DOM element itself
      throw new Error(`Unable to resolve the metadata of property "${name}" of ${owner}`, { cause: attributes[i].span });
    }

    const retval = [
      '{',
      indent(`name: '${input && !input.exposed ? input.name : name}',`)
    ];

    if (typeof value === 'string') {
      retval.push(
        ...indent([
          `value: ${toStringLiteral(value)},`,
          `setter: ${input ? '_setInput' : '_setProperty'}`,
        ])
      );
    } else {
      const { expression, reactive } = resolveExpression(value.expression, generatorContext);
      const setter = reactive
        ? input ? '_setReactiveInput' : '_setReactiveProperty'
        : input ? '_setExpressionInput' : '_setExpressionProperty';
      retval.push(
        ...indent([
          `value: () => ${expression},`,
          `setter: ${setter}`,
        ])
      );
    }

    const extra = new Array<string>();
    if (conditional) {
      if (input) {
        /*
          A required property has no default value to be reset to, and it doesn't need one: the typechecker
          accepts it inside a conditional binding only when every branch binds it, up to an `@else` or a
          `@default` one, so the branch selected next always binds it again.
        */
        if (!input.required) {
          retval[retval.length - 1] = `${retval[retval.length - 1]},`;
          extra.push('unbind: _resetProperty');
        }
      } else {
        retval[retval.length - 1] = `${retval[retval.length - 1]},`;
        extra.push('unbind: _removeAttribute');
      }
    }

    retval.push(
      ...indent(extra),
      '},'
    );

    mappedAttributes.push(...retval);
  }

  return mappedAttributes;
}

/**
 * Maps the classes an element toggles to descriptors `_renderElement` applies like the ones of its attributes, with a
 * setter toggling the class instead of setting an attribute.
 *
 * A class toggled inside a conditional binding is also removed when its branch is no longer the selected one.
 *
 * @param classBindings - The class binding nodes of the element, or of a branch of one of its conditional bindings.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @param conditional - Whether the class bindings are declared inside a conditional binding.
 * @returns Array of generated code lines, one descriptor per class.
 */
function mapClassBindings(classBindings: ClassBindingNode[], generatorContext: GeneratorContext, conditional: boolean): string[] {
  const mappedAttributes = new Array<string>();
  for (let i = 0; i < classBindings.length; i++) {
    const { className, value } = classBindings[i];
    const { expression, reactive } = resolveExpression(value.expression, generatorContext);
    const setter = `setter: ${reactive ? '_setReactiveClass' : '_setExpressionClass'}`;

    mappedAttributes.push(
      '{',
      ...indent([
        `name: ${toStringLiteral(className)},`,
        `value: () => ${expression},`,
        conditional ? `${setter},` : setter
      ])
    );

    if (conditional) {
      mappedAttributes.push(indent('unbind: _removeClass'));
    }

    mappedAttributes.push('},');
  }

  return mappedAttributes;
}

/**
 * Generates the descriptors of the event listeners of a DOM element.
 *
 * The handler of each descriptor is an arrow function making the whole call of the template, with the
 * method and its arguments resolved like any other expression: a method of a member (`cart.clear()`)
 * is called on that member. The arrow function declares the native event as `$event` when an argument reads it, whole or
 * in part (`$event.target`).
 *
 * @param events - The event nodes to bind to the element.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines, one descriptor per event listener.
 */
function mapEvents(events: EventNode[], generatorContext: GeneratorContext): string[] {
  generatorContext.addUnresolvableIdentifier('$event');

  const mappedEvents = events.map(({ name, handler, parameters }) => {
    const method = resolveHandler(handler, generatorContext);
    const args = parameters.map(parameter => resolveExpression(parameter, generatorContext).expression).join(', ');
    const eventParameter = parameters.some(readsEvent) ? '$event' : '';

    return [
      '{',
      ...indent([
        `name: '${name}',`,
        `handler: (${eventParameter}) => ${method}(${args})`
      ]),
      '},'
    ];
  }).flat();

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
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @param owner - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the conditional bindings are declared in.
 * @param isCustomElement - Whether the owner is a custom element.
 * @param isDirective - Whether the owner is a directive.
 * @returns Array of generated code lines, one descriptor per conditional binding.
 */
async function mapConditionalBindings(conditionalBindings: ConditionalBindingNode[], generatorContext: GeneratorContext, owner: string, isCustomElement = false, isDirective = false): Promise<string[]> {
  return mapConditionalBindingDescriptors(conditionalBindings, generatorContext, isEmptyBranch, (branch, condition) => mapBranch(branch, condition, generatorContext, owner, isCustomElement, isDirective));
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
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines, one descriptor per conditional binding.
 */
async function mapStructuralConditionalBindings(conditionalBindings: ConditionalBindingNode[], generatorContext: GeneratorContext): Promise<string[]> {
  return mapConditionalBindingDescriptors(conditionalBindings, generatorContext, branch => !appliesStructuralDirectives(branch), (branch, condition) => mapStructuralBranch(branch, condition, generatorContext));
}

/**
 * Maps conditional binding nodes to descriptors: the branches of the conditional binding, each one mapped by `mapBranch`,
 * and, for a `@switch`, the expression whose value selects the branch to apply.
 *
 * @param conditionalBindings - The conditional binding nodes to map.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @param isEmpty - Tells whether a branch has nothing to apply: a conditional binding whose branches all have nothing to apply is skipped.
 * @param mapBranch - Maps a branch, given the generated code lines declaring its condition, to its descriptor.
 * @returns Array of generated code lines, one descriptor per conditional binding.
 */
async function mapConditionalBindingDescriptors(
  conditionalBindings: ConditionalBindingNode[],
  generatorContext: GeneratorContext,
  isEmpty: Function<[branch: ConditionalBindingBranchNode], boolean>,
  mapBranch: AsyncFunction<[branch: ConditionalBindingBranchNode, condition: string[]], string[]>
): Promise<string[]> {
  const mappedConditionalBindings = new Array<string>();

  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    const { branches } = conditionalBinding;
    if (branches.every(isEmpty)) {
      continue;
    }

    const mappedBranches = new Array<string>();
    for (let j = 0; j < branches.length; j++) {
      mappedBranches.push(...await mapBranch(branches[j], mapCondition(conditionalBinding, j, generatorContext)));
    }

    const retVal = ['{'];

    if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
      retVal.push(indent(`expression: () => ${resolveExpression(conditionalBinding.expression, generatorContext).expression},`));
    }

    retVal.push(
      ...indent([
        'branches: [',
        ...indent(mappedBranches),
        ']'
      ]),
      '},'
    );
    mappedConditionalBindings.push(...retVal);
  };

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
 * Maps what selects a branch of a conditional binding: the condition of an `@if` or `@else if` branch,
 * resolved against the current scope, or the values of the `@case`s of a `@switch` branch, emitted as declared.
 *
 * A branch selected when no other one is has no condition to evaluate:
 * an `@else` branch doesn't declare the condition at all, a `@default` one declares a `null` one.
 *
 * @param conditionalBinding - The conditional binding node the branch belongs to.
 * @param index - The index of the branch among the ones of the conditional binding.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns The generated code lines declaring the condition of the branch, if any.
 */
function mapCondition(conditionalBinding: ConditionalBindingNode, index: number, generatorContext: GeneratorContext): string[] {
  if (conditionalBinding.type === ASTNodeType.SwitchBinding) {
    const { condition } = conditionalBinding.branches[index];
    return [`condition: ${condition ? `[${condition.join(', ')}]` : 'null'},`];
  }

  const { condition } = conditionalBinding.branches[index];
  return condition ? [`condition: () => ${resolveExpression(condition, generatorContext).expression},`] : [];
}

/**
 * Maps a branch of a conditional binding to the descriptor of the bindings `_renderElement` applies while
 * the branch is selected: the attributes, the events, the nested conditional bindings and, for a conditional
 * binding declared on an element, the directives.
 *
 * @param branch - The branch node to map.
 * @param condition - The generated code lines declaring the condition of the branch, if any.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @param owner - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the branch is declared in.
 * @param isCustomElement - Whether the owner is a custom element.
 * @param isDirective - Whether the owner is a directive.
 * @returns Array of generated code lines describing the branch.
 */
async function mapBranch(branch: ConditionalBindingBranchNode, condition: string[], generatorContext: GeneratorContext, owner: string, isCustomElement: boolean, isDirective: boolean): Promise<string[]> {
  const { attributes, classBindings, events, conditionalBindings, directives } = branch;
  const mappedAttributes = mapClassBindings(classBindings, generatorContext, true).concat(await mapAttributes(attributes, generatorContext, owner, isCustomElement, isDirective, true));
  const mappedEvents = mapEvents(events, generatorContext);
  const mappedConditionalBindings = await mapConditionalBindings(conditionalBindings, generatorContext, owner, isCustomElement, isDirective);

  const retVal = [
    '{',
    ...indent(condition)
  ];

  retVal.push(...indent([
    ...mapList('attributes', mappedAttributes),
    ...mapList('events', mappedEvents),
    ...mapList('conditionalBindings', mappedConditionalBindings)
  ]));

  // A conditional binding declared inside a directive cannot apply other directives
  if (!isDirective) {
    const mappedDirectives = await mapDirectives(directives, generatorContext);
    retVal.push(...indent(mapList('directives', mappedDirectives)));
  }

  retVal.push('},');
  return retVal;
}

/**
 * Maps directive nodes to the descriptors `_renderElement` applies to the element:
 * the directive selector, its properties, its events and its conditional bindings.
 *
 * Properties bound directly in the directive are never unbound, since they live as long as the directive.
 *
 * @param directives - The directive nodes applied to the element.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines, one descriptor per directive.
 */
async function mapDirectives(directives: DirectiveNode[], generatorContext: GeneratorContext): Promise<string[]> {
  const mappedDirectives = new Array<string>();

  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes, events, conditionalBindings } = directives[i];
    const mappedAttributes = await mapAttributes(attributes, generatorContext, `@@${selector}`, false, true, false);
    const mappedEvents = mapEvents(events, generatorContext);
    const mappedConditionalBindings = await mapConditionalBindings(conditionalBindings, generatorContext, `@@${selector}`, false, true);

    const retVal = [
      '{',
      ...indent([
        `selector: '${selector}',`
      ])
    ];

    retVal.push(...indent([
      ...mapList('attributes', mappedAttributes),
      ...mapList('events', mappedEvents),
      ...mapList('conditionalBindings', mappedConditionalBindings, '')
    ]));

    retVal.push('},');
    mappedDirectives.push(...retVal);
  }

  return mappedDirectives;
}

/**
 * Maps a branch of a conditional binding declared on an element to the descriptor of the structural directives
 * `_renderElement` applies while the branch is selected: the structural directives and the nested conditional
 * bindings applying them.
 *
 * @param branch - The branch node to map.
 * @param condition - The generated code lines declaring the condition of the branch, if any.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines describing the branch.
 */
async function mapStructuralBranch(branch: ConditionalBindingBranchNode, condition: string[], generatorContext: GeneratorContext): Promise<string[]> {
  const mappedStructuralDirectives = await mapStructuralDirectives(branch.structuralDirectives, generatorContext);
  const mappedConditionalBindings = await mapStructuralConditionalBindings(branch.conditionalBindings, generatorContext);

  return [
    '{',
    ...indent([
      ...condition,
      ...mapList('structuralDirectives', mappedStructuralDirectives),
      ...mapList('conditionalBindings', mappedConditionalBindings)
    ]),
    '},'
  ];
}

/**
 * Maps structural directive nodes to the descriptors `_renderElement` applies to decide whether the element is rendered:
 * the directive selector and its properties.
 *
 * Properties are never unbound, since they live as long as the structural directive and cannot be bound conditionally.
 *
 * @param structuralDirectives - The structural directive nodes applied to the element.
 * @param generatorContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines, one descriptor per structural directive.
 */
async function mapStructuralDirectives(structuralDirectives: StructuralDirectiveNode[], generatorContext: GeneratorContext): Promise<string[]> {
  const mappedStructuralDirectives = new Array<string>();

  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    mappedStructuralDirectives.push(
      '{',
      ...indent([
        `selector: '${selector}',`,
        ...mapList('attributes', await mapAttributes(attributes, generatorContext, `@@${selector}`, false, true, false), '')
      ]),
      '},'
    );
  }

  return mappedStructuralDirectives;
}

/**
 * Maps a list property of a descriptor: the property holding an array literal of the given lines.
 *
 * @param name - The name of the property.
 * @param lines - The lines of the elements of the array.
 * @param separator - The separator following the property.
 * @returns The generated code lines declaring the property.
 */
function mapList(name: string, lines: string[], separator: ',' | '' = ','): string[] {
  return lines.length
    ? [
      `${name}: [`,
      ...indent(lines),
      `]${separator}`
    ]
    : [`${name}: []${separator}`];
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