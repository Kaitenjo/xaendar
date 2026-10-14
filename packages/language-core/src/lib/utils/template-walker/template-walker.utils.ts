import { type ASTNode, ASTNodeType, type AttributeNode, type ComponentMetadata, type ComponentOrDirectiveMetadata, type ConditionalBindingBranchNode, type ConditionalBindingNode, type DirectiveMetadata, type DirectiveNode, type ElementNode, type ElseIfNode, type ElseNode, type EventNode, type ForImplicitVariables, type ForNode, type IfNode, type ImportNode, type StructuralDirectiveNode } from '@xaendar/compiler';
import type { Expression } from 'typescript';

/**
 * The implicit variables declared by every `@for` block.
 */
const FOR_IMPLICIT_VARIABLES: readonly ForImplicitVariables[] = ['$index', '$first', '$last', '$even', '$odd'];

/**
 * Callbacks invoked by {@link walkTemplate} for the parts of a template. Every callback is optional.
 */
export type TemplateVisitor = {
  /**
   * Invoked for every `@import` statement.
   */
  readonly importNode?: (node: ImportNode) => void;
  /**
   * Invoked for every element, with the metadata of the component it is, `undefined` for any other element.
   */
  readonly element?: (node: ElementNode, component: ComponentMetadata | undefined) => void;
  /**
   * Invoked for every attribute of an element or of a directive, conditional bindings included, with the metadata
   * of the component or directive it is bound to, `undefined` for the attributes of any other element.
   */
  readonly attribute?: (node: AttributeNode, owner: ComponentOrDirectiveMetadata | undefined) => void;
  /**
   * Invoked for every event bound on an element or on a directive, conditional bindings included, with the metadata
   * of the component or directive it is bound to, `undefined` for the events of any other element.
   */
  readonly event?: (node: EventNode, owner: ComponentOrDirectiveMetadata | undefined) => void;
  /**
   * Invoked for every directive and structural directive, with its metadata, if imported.
   */
  readonly directive?: (node: DirectiveNode | StructuralDirectiveNode, directive: DirectiveMetadata | undefined) => void;
  /**
   * Invoked for every `@for` block.
   */
  readonly forBlock?: (node: ForNode) => void;
  /**
   * Invoked for every expression, with the names of the variables declared by the template in its scope:
   * the variables of the enclosing `@for` blocks, and `$event` for the parameters of an event.
   */
  readonly expression?: (expression: Expression, variables: ReadonlySet<string>) => void;
};

/**
 * Walks the AST of a template depth-first, invoking the callbacks of the visitor for its parts.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives imported by the template.
 * @param visitor - The callbacks to invoke.
 */
export function walkTemplate(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], visitor: TemplateVisitor): void {
  new TemplateWalker(metadatas, visitor).walkNodes(ast, new Set());
}

/**
 * Returns the names of the variables a `@for` block declares: the item alias and the implicit variables, by their alias if any.
 *
 * @param node - The `@for` block.
 * @returns The names of the variables.
 */
export function getForVariables(node: ForNode): string[] {
  const variables = new Array<string>();
  if (node.itemAlias) {
    variables.push(node.itemAlias);
  }

  for (let i = 0; i < FOR_IMPLICIT_VARIABLES.length; i++) {
    const implicit = FOR_IMPLICIT_VARIABLES[i];
    variables.push(node.implicitAliases.get(implicit) ?? implicit);
  }

  return variables;
}

/**
 * Walks a template on behalf of {@link walkTemplate}.
 */
class TemplateWalker {
  /**
   * Creates a walker.
   *
   * @param _metadatas - The metadata of the components and directives imported by the template.
   * @param _visitor - The callbacks to invoke.
   */
  constructor(private readonly _metadatas: readonly ComponentOrDirectiveMetadata[], private readonly _visitor: TemplateVisitor) { }

  /**
   * Walks a list of nodes.
   *
   * @param nodes - The nodes.
   * @param variables - The variables declared in the scope of the nodes.
   */
  public walkNodes(nodes: readonly ASTNode[], variables: ReadonlySet<string>): void {
    for (let i = 0; i < nodes.length; i++) {
      this._walkNode(nodes[i], variables);
    }
  }

  /**
   * Walks a node and its descendants.
   *
   * @param node - The node.
   * @param variables - The variables declared in the scope of the node.
   */
  private _walkNode(node: ASTNode, variables: ReadonlySet<string>): void {
    switch (node.type) {
      case ASTNodeType.Import:
        this._visitor.importNode?.(node);
        break;

      case ASTNodeType.Interpolation:
        this._visitor.expression?.(node.expression, variables);
        break;

      case ASTNodeType.Element:
        this._walkElement(node, variables);
        break;

      case ASTNodeType.If:
      case ASTNodeType.ElseIf:
      case ASTNodeType.Else:
        this._walkIf(node, variables);
        break;

      case ASTNodeType.For:
        this._walkFor(node, variables);
        break;

      case ASTNodeType.Switch:
        this._visitor.expression?.(node.expression, variables);
        for (let i = 0; i < node.children.length; i++) {
          this.walkNodes(node.children[i].children, variables);
        }
        break;

      default:
        // Text nodes have nothing to visit
        break;
    }
  }

  /**
   * Walks an element: its bindings, its directives and its children.
   *
   * @param node - The element.
   * @param variables - The variables declared in the scope of the element.
   */
  private _walkElement(node: ElementNode, variables: ReadonlySet<string>): void {
    const component = this._metadatas.find((metadata): metadata is ComponentMetadata => metadata.type === 'component' && metadata.selector === node.tagName);
    this._visitor.element?.(node, component);
    this._walkBindings(node, component, variables);
    this.walkNodes(node.children, variables);
  }

  /**
   * Walks the bindings declared on an element, in a directive or in a branch of a conditional binding.
   *
   * @param bindings - The bindings.
   * @param owner - The component or directive the attributes and events are bound to, if any.
   * @param variables - The variables declared in the scope of the bindings.
   */
  private _walkBindings(bindings: Pick<ConditionalBindingBranchNode, 'attributes' | 'events' | 'conditionalBindings'> & Partial<Pick<ConditionalBindingBranchNode, 'directives' | 'structuralDirectives'>>, owner: ComponentOrDirectiveMetadata | undefined, variables: ReadonlySet<string>): void {
    for (let i = 0; i < bindings.attributes.length; i++) {
      const attribute = bindings.attributes[i];
      this._visitor.attribute?.(attribute, owner);
      if (typeof attribute.value === 'object') {
        this._visitor.expression?.(attribute.value.expression, variables);
      }
    }

    const eventVariables = new Set([...variables, '$event']);
    for (let i = 0; i < bindings.events.length; i++) {
      const event = bindings.events[i];
      this._visitor.event?.(event, owner);
      for (let j = 0; j < event.parameters.length; j++) {
        this._visitor.expression?.(event.parameters[j], eventVariables);
      }
    }

    for (let i = 0; i < bindings.conditionalBindings.length; i++) {
      this._walkConditionalBinding(bindings.conditionalBindings[i], owner, variables);
    }

    const { directives, structuralDirectives } = bindings;
    if (directives?.length) {
      for (let i = 0; i < directives.length; i++) {
        this._walkDirective(directives[i], variables);
      }
    }

    if (structuralDirectives?.length) {
      for (let i = 0; i < structuralDirectives.length; i++) {
        this._walkDirective(structuralDirectives[i], variables);
      }
    }
  }

  /**
   * Walks a conditional binding: its conditions and the bindings of its branches.
   *
   * @param node - The conditional binding.
   * @param owner - The component or directive the attributes and events are bound to, if any.
   * @param variables - The variables declared in the scope of the conditional binding.
   */
  private _walkConditionalBinding(node: ConditionalBindingNode, owner: ComponentOrDirectiveMetadata | undefined, variables: ReadonlySet<string>): void {
    if (node.type === ASTNodeType.SwitchBinding) {
      this._visitor.expression?.(node.expression, variables);
      for (let i = 0; i < node.branches.length; i++) {
        this._walkBindings(node.branches[i], owner, variables);
      }
    } else {
      for (let i = 0; i < node.branches.length; i++) {
        const branch = node.branches[i];
        if (branch.condition) {
          this._visitor.expression?.(branch.condition, variables);
        }

        this._walkBindings(branch, owner, variables);
      }
    }
  }

  /**
   * Walks a directive or a structural directive and its bindings.
   *
   * @param node - The directive.
   * @param variables - The variables declared in the scope of the directive.
   */
  private _walkDirective(node: DirectiveNode | StructuralDirectiveNode, variables: ReadonlySet<string>): void {
    const directive = this._metadatas.find((metadata): metadata is DirectiveMetadata => metadata.type === 'directive' && metadata.selector === node.selector);
    this._visitor.directive?.(node, directive);
    this._walkBindings(node.type === ASTNodeType.Directive ? node : { ...node, events: [], conditionalBindings: [] }, directive, variables);
  }

  /**
   * Walks a branch of an `@if` chain and the branches following it.
   *
   * @param node - The `@if`, `@else if` or `@else` branch.
   * @param variables - The variables declared in the scope of the chain.
   */
  private _walkIf(node: IfNode | ElseIfNode | ElseNode, variables: ReadonlySet<string>): void {
    if (node.type !== ASTNodeType.Else) {
      this._visitor.expression?.(node.conditionNode, variables);
    }

    this.walkNodes(node.children, variables);
    if (node.type !== ASTNodeType.Else && node.alternate) {
      this._walkIf(node.alternate, variables);
    }
  }

  /**
   * Walks a `@for` block: the iterable in the enclosing scope, the track expression and the children in the scope
   * declaring the variables of the loop.
   *
   * @param node - The `@for` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkFor(node: ForNode, variables: ReadonlySet<string>): void {
    this._visitor.forBlock?.(node);
    this._visitor.expression?.(node.iterableExpression, variables);

    const loopVariables = new Set([...variables, ...getForVariables(node)]);
    this._visitor.expression?.(node.trackExpression, loopVariables);
    this.walkNodes(node.children, loopVariables);
  }
}
