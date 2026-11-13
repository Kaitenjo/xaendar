import { type ASTNode, ASTNodeType, type AttributeNode, type ComponentMetadata, type ComponentMembers, type ComponentOrDirectiveMetadata, type ConditionalBindingNode, type ElementNode, forEachExpressionChild, getForVariables, isBrowserOnlyGlobal, type SymbolImport, walkTemplate } from '@xaendar/compiler';
import { type Expression, type Identifier, isCallExpression, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';
import type { ComponentUsage } from '../types/component-usage.type';
import type { TemplateUsage } from '../types/template-usage.type';

/**
 * Reads what a template needs from the browser, for the analysis finding the static components of a project: what it
 * does there, which a static component cannot, and the components it renders, with what they depend on.
 *
 * What the analysis cannot prove counts: any call reading a value may read a signal, and so may any variable of the
 * template (the ones of a `@for`, a `@let`, the parameters of a template), whose value may come from one.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives the template imports.
 * @param symbols - The other symbols the template imports.
 * @param members - The members of the component that change how its template is compiled.
 * @returns What the template needs.
 */
export function getTemplateUsage(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], symbols: readonly SymbolImport[], members: Pick<ComponentMembers, 'reactiveMembers' | 'shadowingMembers'>): TemplateUsage {
  const components = new Array<ComponentUsage>();
  collectComponents(ast, { dynamic: false, placeholder: false }, metadatas, collectReactiveNames(ast, metadatas, members.reactiveMembers), components);
  return { logic: findTemplateLogic(ast, metadatas, symbols, members.shadowingMembers), components };
}

/**
 * Lists the names an expression of a template may read a signal through: the members of the component reading one, and
 * the variables of the template, which are values that may come from a signal, as a `@let` reading one, or from the
 * items of a `@for` the browser renders again.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives the template imports.
 * @param reactiveMembers - The members of the component reading a signal.
 * @returns The names.
 */
function collectReactiveNames(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], reactiveMembers: readonly string[]): Set<string> {
  const names = new Set(reactiveMembers);
  walkTemplate(ast, metadatas, {
    forBlock: node => {
      const variables = getForVariables(node);
      for (let i = 0; i < variables.length; i++) {
        names.add(variables[i]);
      }
    },
    let: ({ name }) => names.add(name),
    template: ({ parameters }) => {
      for (let i = 0; i < parameters.length; i++) {
        names.add(parameters[i].name);
      }
    }
  });
  return names;
}

/**
 * Finds what a template does in the browser: its listeners, its directives, its element refs, its `@hydrate`,
 * `@client` and `@defer` blocks, the components of other libraries or loaded by code, the signals of a module and the
 * globals only the browser has.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives the template imports.
 * @param symbols - The other symbols the template imports.
 * @param shadowingMembers - The members of the component named like a global identifier.
 * @returns What it does, `undefined` when it does nothing.
 */
function findTemplateLogic(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], symbols: readonly SymbolImport[], shadowingMembers: readonly string[]): string | undefined {
  const reactive = new Set(symbols.filter(symbol => symbol.reactive).map(({ local }) => local));
  const declared = new Set([...shadowingMembers, ...symbols.map(({ local }) => local)]);
  let logic: string | undefined;

  walkTemplate(ast, metadatas, {
    importNode: node => {
      if (node.lazy) {
        logic ??= `imports ${node.path} lazily`;
      }
    },
    element: (node, component) => {
      if (node.tagName.includes('-') && !component) {
        logic ??= `renders <${node.tagName}>, which is not a component of the project`;
      }
    },
    ref: ({ name }) => logic ??= `declares the element ref #${name}`,
    event: ({ name }) => logic ??= `listens to (${name})`,
    directive: ({ selector }) => logic ??= `applies the directive ${selector}`,
    hydrate: () => logic ??= 'declares a @hydrate',
    client: () => logic ??= 'declares a @client',
    defer: () => logic ??= 'declares a @defer',
    expression: (expression, variables) => {
      logic ??= findExpressionLogic(expression, reactive, name => !declared.has(name) && !variables.has(name));
    }
  });
  return logic;
}

/**
 * Finds what an expression reads that only the browser knows: a signal of a module, which the rest of the page writes, or
 * a global only the browser has, guarded by `typeof` too, since it gives another value there.
 *
 * @param expression - The expression.
 * @param reactive - The imported names reading a signal.
 * @param isGlobal - Tells whether a name reads a global.
 * @returns What it reads, `undefined` when it reads nothing of that.
 */
function findExpressionLogic(expression: Expression, reactive: ReadonlySet<string>, isGlobal: (name: string) => boolean): string | undefined {
  let logic: string | undefined;
  visitReads(expression, ({ text }) => {
    if (reactive.has(text)) {
      logic ??= `reads the signal ${text} of a module`;
    } else if (isBrowserOnlyGlobal(text) && isGlobal(text)) {
      logic ??= `reads the global ${text}`;
    }
  });
  return logic;
}

/**
 * Collects the components a list of nodes renders.
 *
 * @param nodes - The nodes.
 * @param position - Where the nodes are.
 * @param metadatas - The metadata of the components and directives the template imports.
 * @param reactive - The names reading a signal: the members of the component, and the variables of the template.
 * @param components - The usages, filled as they are found.
 */
function collectComponents(nodes: readonly ASTNode[], position: Pick<ComponentUsage, 'dynamic' | 'placeholder'>, metadatas: readonly ComponentOrDirectiveMetadata[], reactive: ReadonlySet<string>, components: ComponentUsage[]): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element: {
        const component = metadatas.find((metadata): metadata is ComponentMetadata => metadata.type === 'component' && metadata.selector === node.tagName);
        if (component) {
          components.push(toUsage(node, component, position, reactive));
        }
        collectComponents(node.children, position, metadatas, reactive, components);
        break;
      }

      case ASTNodeType.If:
      case ASTNodeType.ElseIf: {
        const dynamic = position.dynamic || isReactive(node.conditionNode, reactive);
        collectComponents(node.children, { ...position, dynamic }, metadatas, reactive, components);
        if (node.alternate) {
          collectComponents([node.alternate], { ...position, dynamic }, metadatas, reactive, components);
        }
        break;
      }

      case ASTNodeType.For: {
        const forPosition = { ...position, dynamic: position.dynamic || isReactive(node.iterableExpression, reactive) };
        collectComponents(node.children, forPosition, metadatas, reactive, components);
        if (node.empty) {
          collectComponents(node.empty.children, forPosition, metadatas, reactive, components);
        }
        break;
      }

      case ASTNodeType.Switch:
        collectComponents(node.children, { ...position, dynamic: position.dynamic || isReactive(node.expression, reactive) }, metadatas, reactive, components);
        break;

      case ASTNodeType.Template:
        collectComponents(node.children, { ...position, dynamic: true }, metadatas, reactive, components);
        break;

      // The browser creates the content where the server rendered the @catch, and the @catch where the content throws
      case ASTNodeType.Try:
        collectComponents(node.children, { ...position, dynamic: true }, metadatas, reactive, components);
        collectComponents(node.catch.children, { ...position, dynamic: true }, metadatas, reactive, components);
        break;

      case ASTNodeType.Client:
        collectComponents(node.children, { ...position, dynamic: true }, metadatas, reactive, components);
        if (node.placeholder) {
          collectComponents(node.placeholder.children, { dynamic: position.dynamic, placeholder: true }, metadatas, reactive, components);
        }
        break;

      // The browser creates each part of a @defer, the @placeholder too when the modules of the content fail to load
      case ASTNodeType.Defer:
        collectComponents(node.children, { ...position, dynamic: true }, metadatas, reactive, components);
        if (node.placeholder) {
          collectComponents(node.placeholder.children, { ...position, dynamic: true }, metadatas, reactive, components);
        }

        if (node.loading) {
          collectComponents(node.loading.children, { ...position, dynamic: true }, metadatas, reactive, components);
        }

        if (node.error) {
          collectComponents(node.error.children, { ...position, dynamic: true }, metadatas, reactive, components);
        }
        break;

      case ASTNodeType.Else:
      case ASTNodeType.Case:
      case ASTNodeType.Hydrate:
        collectComponents(node.children, position, metadatas, reactive, components);
        break;

      default:
        // Texts, interpolations, imports, @render and @let render no component
        break;
    }
  }
}

/**
 * Describes a place where a template renders a component.
 *
 * @param element - The element of the component.
 * @param component - The component.
 * @param position - Where the element is.
 * @param reactive - The members of the component of the template reading a signal.
 * @returns The usage.
 */
function toUsage(element: ElementNode, component: ComponentMetadata, position: Pick<ComponentUsage, 'dynamic' | 'placeholder'>, reactive: ReadonlySet<string>): ComponentUsage {
  const expressionInputs = new Array<string>();
  const reactiveInputs = collectInputs(element.attributes, element.conditionalBindings, false, component, reactive, expressionInputs);
  return { component, dynamic: position.dynamic, placeholder: position.placeholder, reactiveInputs, expressionInputs };
}

/**
 * Collects the inputs of a component some bindings set.
 *
 * @param attributes - The attributes of the bindings.
 * @param conditionalBindings - The conditional bindings.
 * @param conditional - Whether the bindings depend on a signal.
 * @param component - The component.
 * @param reactive - The members of the component of the template reading a signal.
 * @param expressionInputs - The names of the inputs bound to an expression, filled as they are found.
 * @returns `true` when an input depends on a signal.
 */
function collectInputs(attributes: readonly AttributeNode[], conditionalBindings: readonly ConditionalBindingNode[], conditional: boolean, component: ComponentMetadata, reactive: ReadonlySet<string>, expressionInputs: string[]): boolean {
  let reactiveInputs = false;
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    if (component.properties.has(name)) {
      reactiveInputs ||= conditional;
      if (typeof value !== 'string') {
        expressionInputs.push(name);
        reactiveInputs ||= isReactive(value.expression, reactive);
      }
    }
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const binding = conditionalBindings[i];
    const dependent = conditional || isBindingReactive(binding, reactive);
    for (let j = 0; j < binding.branches.length; j++) {
      const { attributes: branchAttributes, conditionalBindings: branchBindings } = binding.branches[j];
      reactiveInputs = collectInputs(branchAttributes, branchBindings, dependent, component, reactive, expressionInputs) || reactiveInputs;
    }
  }

  return reactiveInputs;
}

/**
 * Tells whether the branch a conditional binding selects may change.
 *
 * @param binding - The conditional binding.
 * @param reactive - The members reading a signal.
 * @returns `true` when one of its conditions may read a signal.
 */
function isBindingReactive(binding: ConditionalBindingNode, reactive: ReadonlySet<string>): boolean {
  return binding.type === ASTNodeType.SwitchBinding
    ? isReactive(binding.expression, reactive)
    : binding.branches.some(({ condition }) => !!condition && isReactive(condition, reactive));
}

/**
 * Tells whether an expression may read a signal: it reads a reactive member or a variable of the template, or calls
 * anything.
 *
 * @param expression - The expression.
 * @param reactive - The names reading a signal: the members of the component, and the variables of the template.
 * @returns `true` when it may read one.
 */
function isReactive(expression: Node, reactive: ReadonlySet<string>): boolean {
  let found = false;
  visitReads(expression, ({ text }) => {
    found ||= reactive.has(text);
  }, () => {
    found = true;
  });
  return found;
}

/**
 * Visits the identifiers an expression reads: the names of its members, the keys of its objects and the types of its
 * casts (`format(value as Date)`) are left out.
 *
 * @param expression - The expression.
 * @param read - Invoked for each identifier.
 * @param call - Invoked for each call.
 */
function visitReads(expression: Node, read: (identifier: Identifier) => void, call?: () => void): void {
  visitNodeReads(expression, expression, read, call);
}

/**
 * Visits the identifiers a node of an expression, and the nodes it holds, read (see `visitReads`).
 *
 * @param node - The node.
 * @param parent - The parent of the node, the node itself for the expression.
 * @param read - Invoked for each identifier.
 * @param call - Invoked for each call.
 */
function visitNodeReads(node: Node, parent: Node, read: (identifier: Identifier) => void, call?: () => void): void {
  if (isCallExpression(node)) {
    call?.();
  }

  if (!isIdentifier(node)) {
    forEachExpressionChild(node, child => visitNodeReads(child, node, read, call));
  } else if (!((isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node)) {
    read(node);
  }
}
