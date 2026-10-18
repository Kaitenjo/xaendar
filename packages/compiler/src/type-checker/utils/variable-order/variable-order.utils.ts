import { forEachChild, type Expression, type Identifier, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ConditionalBindingBranchNode } from '../../../parser/types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import type { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { ElseIfNode } from '../../../parser/types/nodes/else-if-node.type';
import type { ElseNode } from '../../../parser/types/nodes/else-node.type';
import type { ForNode } from '../../../parser/types/nodes/for-node.type';
import type { IfNode } from '../../../parser/types/nodes/if-node.type';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import { getForVariables } from '../../../parser/utils/for-variables/for-variables.utils';
import { isStructuralElement, visitScopeDeclarations } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
import type { Span } from '../../../types/span.type';

/**
 * A part of the template whose nodes are rendered together: the template itself, or the content of a template
 * (`<template #name(…)>`), rendered by each `@render` calling it.
 */
type Level = TemplateNode | null;

/**
 * A name a scope of the template declares.
 */
type Declaration = {
  /**
   * When the name can be read: the position of the element a template variable names, which is created when the
   * render reaches it, the end of a `@let`, initialized when the render reaches it, or `null` for a name the scope
   * declares as soon as it is created (the item of a `@for` and its implicit variables, the parameters of a template, a
   * template).
   */
  readonly position: number | null;
  /**
   * The part of the template declaring the name.
   */
  readonly level: Level;
  /**
   * The template the name declares, if it declares one.
   */
  readonly template?: TemplateNode;
  /**
   * The `@let` declaring the name, if a `@let` declares it.
   */
  readonly let?: LetNode;
};

/**
 * The names a scope of a template declares.
 */
type ScopeNames = Map<string, Declaration>;

/**
 * A `@render`, with the part of the template it is written in.
 */
type RenderSite = {
  /**
   * The template it renders.
   */
  readonly template: TemplateNode;
  /**
   * The `@render`.
   */
  readonly node: RenderNode;
  /**
   * The part of the template it is written in.
   */
  readonly level: Level;
};

/**
 * The state of the check of a template.
 */
type OrderCheck = {
  /**
   * The names of the scopes enclosing the part being checked, the innermost last.
   */
  readonly scopes: ScopeNames[];
  /**
   * The part of the template being checked.
   */
  level: Level;
  /**
   * For each template, the template variables and the `@let` declared outside of it that its content, or a template it
   * renders, reads as soon as it is rendered, mapped to their names: whether they exist depends on where the template is
   * rendered.
   */
  readonly freeReads: Map<Level, Map<Declaration, string>>;
  /**
   * The `@render`s of the template.
   */
  readonly renders: RenderSite[];
  /**
   * The errors found so far, `undefined` while there are none.
   */
  errors?: Error[];
};

/**
 * Checks that the template variables are read when their element exists, and the `@let` once they are initialized. A
 * template variable is visible in the whole of its scope, before its element too, but its element is created when the
 * render reaches it: an expression evaluated as soon as its part of the template is rendered (an interpolation, the
 * value of a binding, the condition of a block, the iterable of a `@for`, an argument of a `@render`, the value of a
 * `@let`) cannot read a template variable whose element comes after it in its scope. The same holds for a `@let`, whose
 * value cannot read the `@let` itself either. An event handler can, since it runs once the template is rendered. The
 * track expression of a `@for` reads none, since it only reads the item and the implicit variables of the `@for`.
 *
 * The content of a template is rendered where a `@render` calls it: a template variable or a `@let` declared outside of
 * the template, which its content reads, must be created before each `@render` of the template.
 *
 * @example
 * checkVariableOrder(parseTemplate('<p>{ field.value }</p><input #field />'));             // [Error: "field" is read before …]
 * checkVariableOrder(parseTemplate('<button (click)="pick(field)">x</button><input #field />')); // undefined
 *
 * @param ast - The top-level nodes of the template.
 * @returns The errors, each one carrying the span of the read (or of the `@render`) as its cause, `undefined` if every
 *   read is valid.
 */
export function checkVariableOrder(ast: readonly ASTNode[]): Error[] | undefined {
  const check: OrderCheck = { scopes: [], level: null, freeReads: new Map(), renders: [] };
  checkScope(ast, check);
  checkRenders(check);
  return check.errors;
}

/**
 * Checks the nodes of a scope, with the names it declares.
 *
 * @param nodes - The nodes of the scope.
 * @param check - The state of the check.
 */
function checkScope(nodes: readonly ASTNode[], check: OrderCheck): void {
  check.scopes.push(declareNames(nodes, new Map(), check.level));
  checkNodes(nodes, check);
  check.scopes.pop();
}

/**
 * Adds the template variables, the templates and the `@let` a scope declares to its names, the first one of a name
 * declared twice only.
 *
 * @param nodes - The nodes of the scope.
 * @param names - The names of the scope.
 * @param level - The part of the template declaring the scope.
 * @returns The names of the scope.
 */
function declareNames(nodes: readonly ASTNode[], names: ScopeNames, level: Level): ScopeNames {
  const declare = (name: string, declaration: Declaration): void => {
    if (!names.has(name)) {
      names.set(name, declaration);
    }
  };

  // The namespaces of the elements don't decide when they are created
  visitScopeDeclarations(nodes, 'html', {
    variable: (element, { name }) => declare(name, { position: element.span.start, level }),
    template: template => declare(template.variable.name, { position: null, level, template }),
    let: node => declare(node.name, { position: node.span.end, level, let: node })
  });

  return names;
}

/**
 * Checks the content of a template, as a part of the template of its own: a scope declaring the parameters of the
 * template.
 *
 * @param node - The template.
 * @param check - The state of the check.
 */
function checkTemplate(node: TemplateNode, check: OrderCheck): void {
  const { level } = check;
  check.level = node;
  const { parameters } = node;
  const names: ScopeNames = new Map(parameters.map(({ name }) => [name, { position: null, level: node }]));
  check.scopes.push(declareNames(node.children, names, node));
  // The default values are evaluated in the instance, like the bindings of its content
  for (let i = 0; i < parameters.length; i++) {
    const { initializer } = parameters[i];
    if (initializer) {
      checkReads(initializer, node.span, check);
    }
  }

  checkNodes(node.children, check);
  check.scopes.pop();
  check.level = level;
}

/**
 * Checks a `@render`: its arguments, evaluated when it is rendered, and the template it renders, whose free reads are
 * checked once the whole template is (see {@link checkRenders}).
 *
 * @param node - The `@render`.
 * @param check - The state of the check.
 */
function checkRender(node: RenderNode, check: OrderCheck): void {
  for (let i = 0; i < node.arguments.length; i++) {
    checkReads(node.arguments[i], node.span, check);
  }

  // A name that is not a template is reported by the type-check of the @render
  const template = resolve(node.callee, check)?.template;
  if (template) {
    check.renders.push({ template, node, level: check.level });
  }
}

/**
 * Checks the free reads of the templates (see {@link OrderCheck.freeReads}) against their `@render`s: a template
 * variable declared in the part of the template a `@render` is written in must come before it, while one declared
 * further out becomes a free read of the template the `@render` is written in, up to the part declaring it.
 *
 * @param check - The state of the check.
 */
function checkRenders(check: OrderCheck): void {
  const { freeReads, renders } = check;
  // A template rendering another one reads what the other one reads: the free reads spread until none is added
  for (let added = true; added;) {
    added = false;
    for (let i = 0; i < renders.length; i++) {
      const { template, level } = renders[i];
      const reads = freeReads.get(template);
      if (reads?.size) {
        for (const [declaration, name] of reads) {
          added = (declaration.level !== level && addFreeRead(check, level, declaration, name)) || added;
        }
      }
    }
  }

  for (let i = 0; i < renders.length; i++) {
    const { template, node, level } = renders[i];
    const reads = freeReads.get(template);
    if (reads?.size) {
      for (const [{ position, level: declarationLevel, let: letNode }, name] of reads) {
        if (declarationLevel === level && node.span.start < position!) {
          const message = letNode
            ? `"${name}" is read by the template rendered by @render ${node.callee} before its @let: render the template after the @let, or read it from an event handler`
            : `"${name}" is read by the template rendered by @render ${node.callee} before the element it names is created: render the template after the element, or read the variable from an event handler`;
          report(check, message, node.calleeSpan);
        }
      }
    }
  }
}

/**
 * Records a free read of a part of the template (see {@link OrderCheck.freeReads}).
 *
 * @param check - The state of the check.
 * @param level - The part of the template.
 * @param declaration - The template variable read.
 * @param name - The name of the variable.
 * @returns `true` if the read was not recorded yet.
 */
function addFreeRead(check: OrderCheck, level: Level, declaration: Declaration, name: string): boolean {
  let reads = check.freeReads.get(level);
  if (!reads) {
    reads = new Map();
    check.freeReads.set(level, reads);
  }

  const added = !reads.has(declaration);
  reads.set(declaration, name);
  return added;
}

/**
 * Checks a list of nodes of the current scope.
 *
 * @param nodes - The nodes.
 * @param check - The state of the check.
 */
function checkNodes(nodes: readonly ASTNode[], check: OrderCheck): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Interpolation:
        checkReads(node.expression, node.span, check);
        break;

      case ASTNodeType.Element:
        checkElement(node, check);
        break;

      case ASTNodeType.If:
        checkIf(node, check);
        break;

      case ASTNodeType.For:
        checkFor(node, check);
        break;

      case ASTNodeType.Switch:
        checkReads(node.expression, node.span, check);
        for (let j = 0; j < node.children.length; j++) {
          checkScope(node.children[j].children, check);
        }
        break;

      case ASTNodeType.Template:
        checkTemplate(node, check);
        break;

      case ASTNodeType.Render:
        checkRender(node, check);
        break;

      case ASTNodeType.Let:
        checkReads(node.value, node.span, check);
        break;

      default:
        // Texts and imports read nothing
        break;
    }
  }
}

/**
 * Checks an element: its bindings and the ones of its directives, evaluated once it is created, and its children. Its
 * events are not checked, since their handlers run once the template is rendered.
 *
 * @param node - The element.
 * @param check - The state of the check.
 */
function checkElement(node: ElementNode, check: OrderCheck): void {
  checkBindings(node, check);

  // The content of an element a structural directive is applied to is a scope of its own
  if (isStructuralElement(node)) {
    checkScope(node.children, check);
  } else {
    checkNodes(node.children, check);
  }
}

/**
 * Checks the attributes, the class bindings and the conditional bindings declared on an element, in a directive or in
 * a branch of a conditional binding, with the directives the branch applies.
 *
 * @param bindings - The bindings.
 * @param check - The state of the check.
 */
function checkBindings(bindings: Pick<ConditionalBindingBranchNode, 'attributes' | 'conditionalBindings'> & Partial<Pick<ConditionalBindingBranchNode, 'classBindings' | 'directives' | 'structuralDirectives'>>, check: OrderCheck): void {
  checkAttributes(bindings.attributes, check);

  const { classBindings, directives, structuralDirectives } = bindings;
  if (classBindings?.length) {
    for (let i = 0; i < classBindings.length; i++) {
      const { value, span } = classBindings[i];
      checkReads(value.expression, span, check);
    }
  }

  for (let i = 0; i < bindings.conditionalBindings.length; i++) {
    checkConditionalBinding(bindings.conditionalBindings[i], check);
  }

  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      checkBindings(directives[i], check);
    }
  }

  if (structuralDirectives?.length) {
    for (let i = 0; i < structuralDirectives.length; i++) {
      checkAttributes(structuralDirectives[i].attributes, check);
    }
  }
}

/**
 * Checks the values of a list of attributes.
 *
 * @param attributes - The attributes.
 * @param check - The state of the check.
 */
function checkAttributes(attributes: readonly AttributeNode[], check: OrderCheck): void {
  for (let i = 0; i < attributes.length; i++) {
    const { value, span } = attributes[i];
    if (typeof value === 'object') {
      checkReads(value.expression, span, check);
    }
  }
}

/**
 * Checks a conditional binding: the expression or the conditions selecting its branches, and their bindings.
 *
 * @param node - The conditional binding.
 * @param check - The state of the check.
 */
function checkConditionalBinding(node: ConditionalBindingNode, check: OrderCheck): void {
  if (node.type === ASTNodeType.SwitchBinding) {
    checkReads(node.expression, node.span, check);
    for (let i = 0; i < node.branches.length; i++) {
      checkBindings(node.branches[i], check);
    }
  } else {
    for (let i = 0; i < node.branches.length; i++) {
      const branch = node.branches[i];
      if (branch.condition) {
        checkReads(branch.condition, branch.span, check);
      }

      checkBindings(branch, check);
    }
  }
}

/**
 * Checks a branch of an `@if` chain, and the branches following it: the condition in the current scope, the content in
 * a scope of its own.
 *
 * @param node - The `@if`, `@else if` or `@else` branch.
 * @param check - The state of the check.
 */
function checkIf(node: IfNode | ElseIfNode | ElseNode, check: OrderCheck): void {
  if (node.type !== ASTNodeType.Else) {
    checkReads(node.conditionNode, node.span, check);
  }

  checkScope(node.children, check);
  if (node.type !== ASTNodeType.Else && node.alternate) {
    checkIf(node.alternate, check);
  }
}

/**
 * Checks a `@for`: the iterable in the current scope, the track expression and the content in the scope of the loop,
 * which declares its item and its implicit variables.
 *
 * @param node - The `@for`.
 * @param check - The state of the check.
 */
function checkFor(node: ForNode, check: OrderCheck): void {
  checkReads(node.iterableExpression, node.span, check);

  // The variables of the loop exist as soon as its body is created, before the template variables of the body
  const names: ScopeNames = new Map(getForVariables(node).map(name => [name, { position: null, level: check.level }]));
  check.scopes.push(declareNames(node.children, names, check.level));

  const reads = collectReads(node.trackExpression);
  for (let i = 0; i < reads.length; i++) {
    const read = reads[i];
    const declaration = resolve(read.text, check);
    if (typeof declaration?.position === 'number') {
      const name = declaration.let ? `the @let "${read.text}"` : `the template variable "${read.text}"`;
      report(check, `The track expression of a @for cannot read ${name}: it only reads the item of the @for and its implicit variables`, getTemplateSpan(read) ?? node.span);
    }
  }

  checkNodes(node.children, check);
  check.scopes.pop();
}

/**
 * Checks the reads of an expression evaluated as soon as its part of the template is rendered: a template variable
 * declared in the part of the template being checked must be declared by an element coming before, and a `@let` must
 * end before, while one declared outside of the content of the template being checked is a free read of the template
 * (see {@link OrderCheck.freeReads}).
 *
 * @param expression - The expression.
 * @param span - The span of the part declaring the expression, for the reads of an expression without positions.
 * @param check - The state of the check.
 */
function checkReads(expression: Expression, span: Span, check: OrderCheck): void {
  const reads = collectReads(expression);
  for (let i = 0; i < reads.length; i++) {
    const read = reads[i];
    const readSpan = getTemplateSpan(read) ?? span;
    const declaration = resolve(read.text, check);
    if (typeof declaration?.position !== 'number') {
      continue;
    }

    if (declaration.level !== check.level) {
      addFreeRead(check, check.level, declaration, read.text);
    } else if (readSpan.start < declaration.position) {
      const message = declaration.let
        ? `"${read.text}" is read before its @let: only an event handler can read a @let declared after it`
        : `"${read.text}" is read before the element it names is created: only an event handler can read a template variable declared after it`;
      report(check, message, readSpan);
    }
  }
}

/**
 * Resolves a name against the scopes enclosing the part being checked, the innermost first.
 *
 * @param name - The name.
 * @param check - The state of the check.
 * @returns The closest declaration of the name, `undefined` for a name the template doesn't declare (a member, a global).
 */
function resolve(name: string, check: OrderCheck): Declaration | undefined {
  for (let i = check.scopes.length - 1; i >= 0; i--) {
    const scope = check.scopes[i];
    if (scope.has(name)) {
      return scope.get(name);
    }
  }

  return undefined;
}

/**
 * Collects the identifiers of an expression reading a name: the names of the members (`obj.name`, `{ name: 1 }`) don't.
 *
 * @param expression - The expression.
 * @returns The identifiers, in the order they are written.
 */
function collectReads(expression: Expression): Identifier[] {
  const reads = new Array<Identifier>();
  const visit = (node: Node, parent: Node): void => {
    const isMemberName = (isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node;
    if (isIdentifier(node) && !isMemberName) {
      reads.push(node);
    }

    forEachChild(node, child => visit(child, node));
  };

  visit(expression, expression);
  return reads;
}

/**
 * Records an error of the template.
 *
 * @param check - The state of the check.
 * @param message - The description of the error.
 * @param span - The span of the template the error points to.
 */
function report(check: OrderCheck, message: string, span: Span): void {
  check.errors ??= new Array<Error>();
  check.errors.push(new Error(message, { cause: span }));
}
