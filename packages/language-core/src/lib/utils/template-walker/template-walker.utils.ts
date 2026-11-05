import { type ASTNode, ASTNodeType, type CatchNode, type ClientNode, type ComponentMetadata, type ComponentOrDirectiveMetadata, type ConditionalBindingBranchNode, type ConditionalBindingNode, type DeferNode, type DirectiveMetadata, type DirectiveNode, type ElementNode, type ElseIfNode, type ElseNode, type ErrorNode, type ForNode, getForVariables, type HydrateNode, type IfNode, isStructuralElement, type StructuralDirectiveNode, visitScopeDeclarations } from '@xaendar/compiler';
import type { TemplateVisitor } from '../../types/template-visitor.type';

/**
 * Walks the AST of a template depth-first, invoking the callbacks of the visitor for its parts.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives imported by the template.
 * @param visitor - The callbacks to invoke.
 * @param server - Whether to walk only what the server renders: the content of the `@client` blocks, the `when` of the
 *   `@hydrate` blocks, the listeners and the custom directives run only in the browser.
 */
export function walkTemplate(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], visitor: TemplateVisitor, server = false): void {
  new TemplateWalker(metadatas, visitor, server).walkScope(ast, new Set());
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
   * @param _server - Whether to walk only what the server renders.
   */
  constructor(private readonly _metadatas: readonly ComponentOrDirectiveMetadata[], private readonly _visitor: TemplateVisitor, private readonly _server: boolean) { }

  /**
   * Walks the nodes of a scope, whose element refs, templates and `@let` are visible in the whole of it (see
   * `visitScopeDeclarations`).
   *
   * @param nodes - The nodes of the scope.
   * @param variables - The variables declared by the scopes enclosing it.
   */
  public walkScope(nodes: readonly ASTNode[], variables: ReadonlySet<string>): void {
    let scopeVariables: Set<string> | undefined;
    const declare = (name: string): void => {
      scopeVariables ??= new Set(variables);
      scopeVariables.add(name);
    };

    // The namespaces of the elements don't matter here
    visitScopeDeclarations(nodes, 'html', {
      ref: (_element, { name }) => declare(name),
      template: ({ declaration: { name } }) => declare(name),
      let: ({ name }) => declare(name)
    });

    this._walkNodes(nodes, scopeVariables ?? variables);
  }

  /**
   * Walks a list of nodes of a scope.
   *
   * @param nodes - The nodes.
   * @param variables - The variables declared in the scope of the nodes.
   */
  private _walkNodes(nodes: readonly ASTNode[], variables: ReadonlySet<string>): void {
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
          this.walkScope(node.children[i].children, variables);
        }
        break;

      case ASTNodeType.Hydrate:
        this._visitor.hydrate?.(node);
        this._walkHydrate(node, variables);
        break;

      case ASTNodeType.Client:
        this._visitor.client?.(node);
        this._walkClient(node, variables);
        break;

      case ASTNodeType.Try:
        this._visitor.tryBlock?.(node);
        this.walkScope(node.children, variables);
        this._walkErrorScope(node.catch, variables);
        break;

      case ASTNodeType.Defer:
        this._visitor.defer?.(node);
        this._walkDefer(node, variables);
        break;

      case ASTNodeType.Template: {
        this._visitor.template?.(node);
        // The content of a template is a scope of its own, declaring the parameters of the template, which their default values read too
        const contentVariables = new Set([...variables, ...node.parameters.map(({ name }) => name)]);
        for (let i = 0; i < node.parameters.length; i++) {
          const { initializer } = node.parameters[i];
          if (initializer) {
            this._visitor.expression?.(initializer, contentVariables);
          }
        }

        this.walkScope(node.children, contentVariables);
        break;
      }

      case ASTNodeType.Render:
        this._visitor.render?.(node);
        for (let i = 0; i < node.arguments.length; i++) {
          this._visitor.expression?.(node.arguments[i], variables);
        }
        break;

      case ASTNodeType.Let:
        this._visitor.let?.(node);
        this._visitor.expression?.(node.value, variables);
        break;

      default:
        // Text nodes have nothing to visit
        break;
    }
  }

  /**
   * Walks an element: its element ref, its bindings, its directives and its children, which are a scope of their
   * own when a structural directive is applied to the element.
   *
   * @param node - The element.
   * @param variables - The variables declared in the scope of the element.
   */
  private _walkElement(node: ElementNode, variables: ReadonlySet<string>): void {
    const component = this._metadatas.find((metadata): metadata is ComponentMetadata => metadata.type === 'component' && metadata.selector === node.tagName);
    this._visitor.element?.(node, component);
    if (node.ref) {
      this._visitor.ref?.(node.ref);
    }

    this._walkBindings(node, component, variables);
    if (isStructuralElement(node)) {
      this.walkScope(node.children, variables);
    } else {
      this._walkNodes(node.children, variables);
    }
  }

  /**
   * Walks the bindings declared on an element, in a directive or in a branch of a conditional binding.
   *
   * @param bindings - The bindings.
   * @param owner - The component or directive the attributes and events are bound to, if any.
   * @param variables - The variables declared in the scope of the bindings.
   */
  private _walkBindings(bindings: Pick<ConditionalBindingBranchNode, 'attributes' | 'events' | 'conditionalBindings'> & Partial<Pick<ConditionalBindingBranchNode, 'classBindings' | 'directives' | 'structuralDirectives'>>, owner: ComponentOrDirectiveMetadata | undefined, variables: ReadonlySet<string>): void {
    for (let i = 0; i < bindings.attributes.length; i++) {
      const attribute = bindings.attributes[i];
      this._visitor.attribute?.(attribute, owner);
      if (typeof attribute.value === 'object') {
        this._visitor.expression?.(attribute.value.expression, variables);
      }
    }

    const { classBindings, directives, structuralDirectives } = bindings;
    if (classBindings?.length) {
      for (let i = 0; i < classBindings.length; i++) {
        const classBinding = classBindings[i];
        this._visitor.classBinding?.(classBinding);
        this._visitor.expression?.(classBinding.value.expression, variables);
      }
    }

    if (!this._server) {
      const eventVariables = new Set([...variables, '$event']);
      for (let i = 0; i < bindings.events.length; i++) {
        const event = bindings.events[i];
        this._visitor.event?.(event, owner, variables);
        for (let j = 0; j < event.parameters.length; j++) {
          this._visitor.expression?.(event.parameters[j], eventVariables);
        }
      }
    }

    for (let i = 0; i < bindings.conditionalBindings.length; i++) {
      this._walkConditionalBinding(bindings.conditionalBindings[i], owner, variables);
    }

    if (directives?.length && !this._server) {
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

    this.walkScope(node.children, variables);
    if (node.type !== ASTNodeType.Else && node.alternate) {
      this._walkIf(node.alternate, variables);
    }
  }

  /**
   * Walks a `@hydrate` block: the expression of its `when` trigger, and its content, a scope of its own.
   *
   * @param node - The `@hydrate` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkHydrate(node: HydrateNode, variables: ReadonlySet<string>): void {
    this._walkWhen(node, variables);
    this.walkScope(node.children, variables);
  }

  /**
   * Walks a `@defer` block: the expression of its `when` trigger, its content and the blocks following it, each one a
   * scope of its own, the `@error` declaring the error under the name it gives it. The server renders only its
   * `@placeholder`.
   *
   * @param node - The `@defer` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkDefer(node: DeferNode, variables: ReadonlySet<string>): void {
    const { placeholder, loading, error } = node;
    if (!this._server) {
      this._walkWhen(node, variables);
      this.walkScope(node.children, variables);
    }

    if (placeholder) {
      this.walkScope(placeholder.children, variables);
    }

    if (!this._server && loading) {
      this.walkScope(loading.children, variables);
    }

    if (!this._server && error) {
      this._walkErrorScope(error, variables);
    }
  }

  /**
   * Walks the expression of the `when` trigger of a block, if any, which the server does not read.
   *
   * @param node - The `@hydrate` or `@defer` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkWhen({ triggers }: HydrateNode | DeferNode, variables: ReadonlySet<string>): void {
    for (let i = 0; !this._server && i < triggers.length; i++) {
      const trigger = triggers[i];
      if (trigger.kind === 'when') {
        this._visitor.expression?.(trigger.expressionNode, variables);
      }
    }
  }

  /**
   * Walks a `@client` block: its content and its `@placeholder`, if any, each one a scope of its own.
   *
   * @param node - The `@client` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkClient(node: ClientNode, variables: ReadonlySet<string>): void {
    if (!this._server) {
      this.walkScope(node.children, variables);
    }

    if (node.placeholder) {
      this.walkScope(node.placeholder.children, variables);
    }
  }

  /**
   * Walks a block receiving an error, a scope of its own declaring the error under the name it gives it: the `@catch` of
   * a `@try`, which the server renders as it does the content, or the `@error` of a `@defer`.
   *
   * @param node - The `@catch` or `@error` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkErrorScope({ name, children }: CatchNode | ErrorNode, variables: ReadonlySet<string>): void {
    const errorVariables = new Set(variables);
    if (name) {
      errorVariables.add(name);
    }

    this.walkScope(children, errorVariables);
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
    this.walkScope(node.children, loopVariables);
  }
}
