import type { ASTNode } from '../../parser/types/ast.type';
import type { CaseNode } from '../../parser/types/nodes/case-node.type';
import type { CatchNode } from '../../parser/types/nodes/catch-node.type';
import type { ClientNode } from '../../parser/types/nodes/client-node.type';
import type { ConditionalBindingBranchNode } from '../../parser/types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../parser/types/nodes/conditional-binding-node.type';
import type { DeferNode } from '../../parser/types/nodes/defer-node.type';
import type { DirectiveNode } from '../../parser/types/nodes/directive-node.type';
import type { ElementNode } from '../../parser/types/nodes/element-node.type';
import type { ElseIfNode } from '../../parser/types/nodes/else-if-node.type';
import type { ElseNode } from '../../parser/types/nodes/else-node.type';
import type { ErrorNode } from '../../parser/types/nodes/error-node.type';
import type { ForNode } from '../../parser/types/nodes/for-node.type';
import type { HydrateNode } from '../../parser/types/nodes/hydrate-node.type';
import type { IfNode } from '../../parser/types/nodes/if-node.type';
import type { StructuralDirectiveNode } from '../../parser/types/nodes/structural-directive-node.type';
import type { HydrateTrigger } from '../../parser/types/triggers/hydrate-trigger.type';
import type { ComponentMetadata } from '../../types/component-metadata.type';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
import type { DirectiveMetadata } from '../../types/directive-metadata.type';
import { isIdentifier } from 'typescript';
import { ASTNodeType } from '../../parser/types/node.enum';
import { getForVariables } from '../../parser/utils/for-variables/for-variables.utils';
import { isStructuralElement, visitScopeDeclarations } from '../../parser/utils/scope-declarations/scope-declarations.utils';
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
    // The namespaces of the elements don't matter here
    visitScopeDeclarations(nodes, 'html', {
      ref: (_element, { name }) => {
        scopeVariables = declareVariable(scopeVariables, variables, name);
      },
      template: ({ declaration: { name } }) => {
        scopeVariables = declareVariable(scopeVariables, variables, name);
      },
      let: ({ name }) => {
        scopeVariables = declareVariable(scopeVariables, variables, name);
      }
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
          const caseNode: CaseNode = node.children[i];
          this._visitor.switchCase?.(caseNode);
          this.walkScope(caseNode.children, variables);
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
        // A @render calling an expression reads it like its arguments: a name is the one of a template, or read by `render`
        if (!isIdentifier(node.calleeExpression)) {
          this._visitor.expression?.(node.calleeExpression, variables);
        }

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
   * Walks the expressions of the triggers of a block, the ones following `prefetch` too, which the server does not read:
   * the one of `when`, the element ref naming the element a trigger watches, and the options of the observer of
   * `visible`.
   *
   * @param node - The `@hydrate` or `@defer` block.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkWhen({ triggers, prefetch }: HydrateNode | DeferNode, variables: ReadonlySet<string>): void {
    if (!this._server) {
      this._walkTriggers(triggers, variables);
      this._walkTriggers(prefetch, variables);
    }
  }

  /**
   * Walks the expressions of triggers (see {@link _walkWhen}).
   *
   * @param triggers - The triggers.
   * @param variables - The variables declared in the scope enclosing the block.
   */
  private _walkTriggers(triggers: readonly HydrateTrigger[], variables: ReadonlySet<string>): void {
    for (let i = 0; i < triggers.length; i++) {
      const trigger = triggers[i];
      switch (trigger.kind) {
        case 'when':
          this._visitor.expression?.(trigger.expressionNode, variables);
          break;

        case 'visible':
        case 'interaction':
        case 'hover':
          if (trigger.target) {
            this._visitor.expression?.(trigger.target.expressionNode, variables);
          }

          if (trigger.kind === 'visible' && trigger.options) {
            this._visitor.expression?.(trigger.options.expressionNode, variables);
          }
          break;

        default:
          // The other triggers read nothing of the template
          break;
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

/**
 * Adds a variable a scope declares to its variables, created from the ones of the scopes enclosing it the first time.
 *
 * @param scopeVariables - The variables of the scope, `undefined` until it declares one.
 * @param variables - The variables declared by the scopes enclosing it.
 * @param name - The name of the variable.
 * @returns The variables of the scope.
 */
function declareVariable(scopeVariables: Set<string> | undefined, variables: ReadonlySet<string>, name: string): Set<string> {
  scopeVariables ??= new Set(variables);
  scopeVariables.add(name);
  return scopeVariables;
}
