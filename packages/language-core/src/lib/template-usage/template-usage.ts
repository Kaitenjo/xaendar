import { type ASTNode, ASTNodeType, type AttributeNode, type ComponentMetadata, type ComponentMembers, type ComponentOrDirectiveMetadata, type ConditionalBindingNode, type ElementNode, isBrowserOnlyGlobal, type SymbolImport } from '@xaendar/compiler';
import { type Expression, forEachChild, type Identifier, isCallExpression, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';
import type { ComponentUsage } from '../types/component-usage.type';
import type { TemplateUsage } from '../types/template-usage.type';
import { walkTemplate } from '../utils/template-walker/template-walker.utils';

/**
 * Reads what a template needs from the browser, for the analysis finding the static components of a project: what it
 * does there, which a static component cannot, and the components it renders, with what they depend on.
 *
 * What the analysis cannot prove counts: any call reading a value may read a signal.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives the template imports.
 * @param symbols - The other symbols the template imports.
 * @param members - The members of the component that change how its template is compiled.
 * @returns What the template needs.
 */
export function getTemplateUsage(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], symbols: readonly SymbolImport[], members: Pick<ComponentMembers, 'reactiveMembers' | 'shadowingMembers'>): TemplateUsage {
  const components = new Array<ComponentUsage>();
  collectComponents(ast, { dynamic: false, placeholder: false }, metadatas, new Set(members.reactiveMembers), components);
  return { logic: findTemplateLogic(ast, metadatas, symbols, members.shadowingMembers), components };
}

/**
 * Finds what a template does in the browser: its listeners, its directives, its element refs, its `@hydrate` and
 * `@client` blocks, the components of other libraries or loaded by code, the signals of a module and the globals only
 * the browser has.
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
 * @param reactive - The members of the component reading a signal.
 * @param components - The usages, filled as they are found.
 */
function collectComponents(nodes: readonly ASTNode[], position: Pick<ComponentUsage, 'dynamic' | 'placeholder'>, metadatas: readonly ComponentOrDirectiveMetadata[], reactive: ReadonlySet<string>, components: ComponentUsage[]): void {
  const visit = (children: readonly ASTNode[], dynamic = position.dynamic): void => collectComponents(children, { ...position, dynamic }, metadatas, reactive, components);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element: {
        const component = metadatas.find((metadata): metadata is ComponentMetadata => metadata.type === 'component' && metadata.selector === node.tagName);
        if (component) {
          components.push(toUsage(node, component, position, reactive));
        }
        visit(node.children);
        break;
      }

      case ASTNodeType.If:
      case ASTNodeType.ElseIf: {
        const dynamic = position.dynamic || isReactive(node.conditionNode, reactive);
        visit(node.children, dynamic);
        if (node.alternate) {
          visit([node.alternate], dynamic);
        }
        break;
      }

      case ASTNodeType.For:
        visit(node.children, position.dynamic || isReactive(node.iterableExpression, reactive));
        break;

      case ASTNodeType.Switch:
        visit(node.children, position.dynamic || isReactive(node.expression, reactive));
        break;

      case ASTNodeType.Template:
        visit(node.children, true);
        break;

      case ASTNodeType.Client:
        visit(node.children, true);
        if (node.placeholder) {
          collectComponents(node.placeholder.children, { dynamic: position.dynamic, placeholder: true }, metadatas, reactive, components);
        }
        break;

      case ASTNodeType.Else:
      case ASTNodeType.Case:
      case ASTNodeType.Hydrate:
        visit(node.children);
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
 * Tells whether an expression may read a signal: it reads a reactive member, or calls anything.
 *
 * @param expression - The expression.
 * @param reactive - The members reading a signal.
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
 * Visits the identifiers an expression reads: the names of its members and the keys of its objects are left out.
 *
 * @param expression - The expression.
 * @param read - Invoked for each identifier.
 * @param call - Invoked for each call.
 */
function visitReads(expression: Node, read: (identifier: Identifier) => void, call?: () => void): void {
  const visit = (node: Node, parent: Node): void => {
    if (isCallExpression(node)) {
      call?.();
    }

    if (!isIdentifier(node)) {
      forEachChild(node, child => visit(child, node));
    } else if (!((isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node)) {
      read(node);
    }
  };

  visit(expression, expression);
}
