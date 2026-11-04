import globals from 'globals';
import { canHaveDecorators, ClassElement, ClassLikeDeclaration, CompilerOptions, Expression, forEachChild, getDecorators, Identifier, isArrayLiteralExpression, isArrowFunction, isAsExpression, isBinaryExpression, isBindingElement, isCallExpression, isClassDeclaration, isClassStaticBlockDeclaration, isConditionalExpression, isConstructorDeclaration, isElementAccessExpression, isEnumDeclaration, isExportAssignment, isExportDeclaration, isFunctionDeclaration, isFunctionExpression, isFunctionLike, isIdentifier, isImportClause, isImportDeclaration, isImportSpecifier, isInterfaceDeclaration, isMethodDeclaration, isGetAccessorDeclaration, isSetAccessorDeclaration, isNamedImports, isNamespaceImport, isNewExpression, isNonNullExpression, isNoSubstitutionTemplateLiteral, isNumericLiteral, isObjectLiteralExpression, isParameter, isParenthesizedExpression, isPrefixUnaryExpression, isPropertyAccessExpression, isPropertyAssignment, isPropertyDeclaration, isRegularExpressionLiteral, isShorthandPropertyAssignment, isSpreadAssignment, isSpreadElement, isStringLiteral, isSatisfiesExpression, isExpressionStatement, isTemplateExpression, isTypeAliasDeclaration, isTypeAssertionExpression, isTypeNode, isTypeOfExpression, isVariableDeclaration, isVariableStatement, Node, ObjectLiteralElementLike, SourceFile, SyntaxKind } from 'typescript';
import { isBrowserOnlyGlobal } from '../../generator/utils/generator/generator.utils';
import type { ComponentDeclaration } from '../../types/component-declaration.type';
import type { ResolvedClass } from '../../types/resolved-class.type';
import { isModuleSignal, readsModuleSignal } from '../extract-component-members/extract-component-members.utils';
import { DEFAULT_COMPILER_OPTIONS, resolveBaseClassOf } from '../resolve-declaration/resolve-declaration.utils';

/**
 * The hooks of a component running in the browser: `onInit` runs there too, and its code cannot be told from one that
 * only prepares the data of the template.
 */
const LIFECYCLE_HOOKS: ReadonlySet<string> = new Set(['onInit', 'afterRender', 'onDestroy']);

/**
 * The decorators of the members of a component that only describe what the server renders too.
 */
const SERVER_DECORATORS: ReadonlySet<string> = new Set(['Property', 'HostProperty']);

/**
 * The members of a component creating what lives in the browser.
 */
const BROWSER_MEMBERS: ReadonlySet<string> = new Set(['effect', 'createComponent']);

/**
 * The functions of `@xaendar/core` a field can be initialized with, which read a value and start nothing.
 */
const VALUE_FUNCTIONS: ReadonlySet<string> = new Set(['computed', 'getTransferState']);

/**
 * The assignment operators, which make a binary expression change what it reads.
 */
const ASSIGNMENTS = { first: SyntaxKind.FirstAssignment, last: SyntaxKind.LastAssignment };

/**
 * Finds what a component does in the browser, reading its class and the classes it inherits from: the build leaves a
 * component without any such logic as the HTML of the server, if nothing else needs it. The analysis proves that a
 * component is static: what it cannot read counts as logic, as a field initialized by a function of the application,
 * whose code may start anything.
 *
 * @param declaration - The class of the component and its `@WebComponent` decorator.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns What the logic is, for the report of the build, `undefined` when the component has none.
 */
export function findComponentLogic({ klass, decorator }: ComponentDeclaration, compilerOptions: CompilerOptions = DEFAULT_COMPILER_OPTIONS): string | undefined {
  const options = decorator.expression.arguments[0];
  const optionsLogic = options && isObjectLiteralExpression(options) ? findOptionsLogic(options.properties) : 'declares its options through an expression';
  if (optionsLogic) {
    return optionsLogic;
  }

  const visited = new Set<ClassLikeDeclaration>();
  let current: ResolvedClass | undefined = { sourceFile: klass.getSourceFile(), declaration: klass };
  while (current && !visited.has(current.declaration)) {
    visited.add(current.declaration);
    const { sourceFile, declaration } = current;
    const logic = findClassLogic(declaration, sourceFile, compilerOptions);
    if (logic) {
      return logic;
    }

    const extended = declaration.heritageClauses?.find(clause => clause.token === SyntaxKind.ExtendsKeyword)?.types[0].expression;
    if (!extended || extendsCustomElement(extended, sourceFile)) {
      return undefined;
    }

    current = resolveBaseClassOf(current, compilerOptions);
    if (!current || current.sourceFile.isDeclarationFile) {
      return `extends ${extended.getText(sourceFile)}, whose code cannot be read`;
    }
  }

  return undefined;
}

/**
 * Finds what the file of a component runs by itself when it is evaluated, or loads for its effects: leaving it out of the
 * bundle of the browser would leave that out too.
 *
 * @param sourceFile - The file.
 * @param compilerOptions - Project compiler options, driving how the modules read by the file are resolved.
 * @returns What it runs, for the report of the build, `undefined` when it only declares.
 */
export function findModuleLogic(sourceFile: SourceFile, compilerOptions: CompilerOptions = DEFAULT_COMPILER_OPTIONS): string | undefined {
  const declared = collectDeclaredNames(sourceFile);
  for (let i = 0; i < sourceFile.statements.length; i++) {
    const statement = sourceFile.statements[i];
    if (isImportDeclaration(statement)) {
      if (!statement.importClause) {
        return `imports ${statement.moduleSpecifier.getText(sourceFile)} for its effects`;
      }
    } else if (isVariableStatement(statement)) {
      const { declarations } = statement.declarationList;
      for (let j = 0; j < declarations.length; j++) {
        const { initializer } = declarations[j];
        if (initializer && !isValue(initializer, sourceFile, declared, compilerOptions)) {
          return `runs ${declarations[j].name.getText(sourceFile)} when its module is evaluated`;
        }
      }
    } else if (!isDeclaration(statement)) {
      return 'runs code when its module is evaluated';
    }
  }

  return undefined;
}

/**
 * Tells whether a statement of a module only declares something.
 *
 * @param statement - The statement.
 * @returns `true` for a declaration.
 */
function isDeclaration(statement: Node): boolean {
  return isClassDeclaration(statement)
    || isFunctionDeclaration(statement)
    || isInterfaceDeclaration(statement)
    || isTypeAliasDeclaration(statement)
    || isEnumDeclaration(statement)
    || isExportDeclaration(statement)
    || isExportAssignment(statement);
}

/**
 * Finds what the options of `@WebComponent` ask for in the browser: the host directives, which run there, and any option
 * of `ssr`. A component declaring `ssr` wants to hydrate, when a trigger fires or whatever the build finds.
 *
 * @param properties - The options.
 * @returns What they ask for, `undefined` when they ask for nothing.
 */
function findOptionsLogic(properties: readonly ObjectLiteralElementLike[]): string | undefined {
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const name = property.name?.getText();
    if (name === 'hostDirectives') {
      return 'declares host directives';
    }

    if (name === 'ssr' && !(isPropertyAssignment(property) && isObjectLiteralExpression(property.initializer) && !property.initializer.properties.length)) {
      return 'declares the ssr option';
    }
  }

  return undefined;
}

/**
 * Tells whether the class a component extends is `CustomElement` of `@xaendar/core`, where the chain of its classes ends.
 *
 * @param extended - The expression of the `extends` clause.
 * @param sourceFile - The file of the class.
 * @returns `true` for `CustomElement`.
 */
function extendsCustomElement(extended: Expression, sourceFile: SourceFile): boolean {
  return isIdentifier(extended) && getCoreImport(extended, sourceFile) === 'CustomElement';
}

/**
 * Finds the export of `@xaendar/core` an identifier reads.
 *
 * @param identifier - The identifier.
 * @param sourceFile - The file of the identifier.
 * @returns The name of the export, `undefined` when the identifier does not read one.
 */
function getCoreImport({ text }: Identifier, sourceFile: SourceFile): string | undefined {
  for (let i = 0; i < sourceFile.statements.length; i++) {
    const statement = sourceFile.statements[i];
    if (isImportDeclaration(statement) && isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith('@xaendar/core')) {
      const bindings = statement.importClause?.namedBindings;
      const element = bindings && isNamedImports(bindings) ? bindings.elements.find(({ name }) => name.text === text) : undefined;
      if (element) {
        return (element.propertyName ?? element.name).text;
      }
    }
  }

  return undefined;
}

/**
 * Finds what a class of a component does in the browser.
 *
 * @param declaration - The class.
 * @param sourceFile - The file of the class.
 * @param compilerOptions - Project compiler options.
 * @returns What it does, `undefined` when it does nothing.
 */
function findClassLogic(declaration: ClassLikeDeclaration, sourceFile: SourceFile, compilerOptions: CompilerOptions): string | undefined {
  const declared = collectDeclaredNames(sourceFile);
  for (let i = 0; i < declaration.members.length; i++) {
    const logic = findMemberLogic(declaration.members[i], sourceFile, declared, compilerOptions);
    if (logic) {
      return logic;
    }
  }

  return undefined;
}

/**
 * Finds what a member of a class does in the browser.
 *
 * @param member - The member.
 * @param sourceFile - The file of the class.
 * @param declared - The names the file declares, which are not globals.
 * @param compilerOptions - Project compiler options.
 * @returns What it does, `undefined` when it does nothing.
 */
function findMemberLogic(member: ClassElement, sourceFile: SourceFile, declared: ReadonlySet<string>, compilerOptions: CompilerOptions): string | undefined {
  if (isClassStaticBlockDeclaration(member)) {
    return 'runs code in a static block';
  }

  if (isConstructorDeclaration(member)) {
    const runsCode = member.body?.statements.some(statement => !(isExpressionStatement(statement) && isCallExpression(statement.expression) && statement.expression.expression.kind === SyntaxKind.SuperKeyword));
    return runsCode ? 'runs code in its constructor' : undefined;
  }

  const decorator = findBrowserDecorator(member, sourceFile);
  if (decorator) {
    return `declares ${decorator}`;
  }

  const name = member.name?.getText(sourceFile);
  if (name && LIFECYCLE_HOOKS.has(name)) {
    return `declares ${name}`;
  }

  if (isPropertyDeclaration(member)) {
    return member.initializer ? findInitializerLogic(name!, member.initializer, sourceFile, declared, compilerOptions) : undefined;
  }

  const body = (isMethodDeclaration(member) || isGetAccessorDeclaration(member) || isSetAccessorDeclaration(member)) ? member.body : undefined;
  return body && findBodyLogic(body, sourceFile, declared, compilerOptions);
}

/**
 * Finds a decorator of a member that needs the browser.
 *
 * @param member - The member.
 * @param sourceFile - The file of the class.
 * @returns The decorator as written, `undefined` when there is none.
 */
function findBrowserDecorator(member: ClassElement, sourceFile: SourceFile): string | undefined {
  const decorators = canHaveDecorators(member) ? getDecorators(member) : undefined;
  if (decorators?.length) {
    for (let i = 0; i < decorators.length; i++) {
      const { expression } = decorators[i];
      const callee = isCallExpression(expression) ? expression.expression : expression;
      const root = isPropertyAccessExpression(callee) ? callee.expression : callee;
      if (!SERVER_DECORATORS.has(root.getText(sourceFile))) {
        return `@${root.getText(sourceFile)}`;
      }
    }
  }

  return undefined;
}

/**
 * Finds what the initializer of a field does in the browser: creating a signal, which is written at least once, or
 * running code the build cannot read.
 *
 * @param name - The name of the field.
 * @param initializer - The initializer.
 * @param sourceFile - The file of the class.
 * @param declared - The names the file declares, which are not globals.
 * @param compilerOptions - Project compiler options.
 * @returns What it does, `undefined` when it computes a value.
 */
function findInitializerLogic(name: string, initializer: Expression, sourceFile: SourceFile, declared: ReadonlySet<string>, compilerOptions: CompilerOptions): string | undefined {
  if (isCallExpression(initializer) && isIdentifier(initializer.expression) && getCoreImport(initializer.expression, sourceFile) === 'signal') {
    return `creates the signal ${name}`;
  }

  return isValue(initializer, sourceFile, declared, compilerOptions) ? undefined : `runs code to initialize ${name}`;
}

/**
 * Tells whether an expression only computes a value out of what the build can read: literals and what is built from
 * them, the names it reads, unless they are signals of a module, the functions of ECMAScript, `computed`, and functions
 * doing nothing in the browser. Anything else may start something.
 *
 * @param node - The expression.
 * @param sourceFile - The file of the expression.
 * @param declared - The names the file declares, which are not globals.
 * @param compilerOptions - Project compiler options.
 * @returns `true` when it only computes a value.
 */
function isValue(node: Expression, sourceFile: SourceFile, declared: ReadonlySet<string>, compilerOptions: CompilerOptions): boolean {
  const isPart = (part: Expression): boolean => isValue(part, sourceFile, declared, compilerOptions);
  if (isLiteral(node) || node.kind === SyntaxKind.ThisKeyword) {
    return true;
  }

  if (isIdentifier(node)) {
    return !isModuleSignal(node, sourceFile, compilerOptions);
  }

  if (isPropertyAccessExpression(node)) {
    return isPart(node.expression) && !isModuleSignal(node, sourceFile, compilerOptions);
  }

  if (isParenthesizedExpression(node) || isAsExpression(node) || isSatisfiesExpression(node) || isNonNullExpression(node) || isTypeAssertionExpression(node) || isTypeOfExpression(node) || isSpreadElement(node)) {
    return isPart(node.expression);
  }

  if (isElementAccessExpression(node)) {
    return isPart(node.expression) && isPart(node.argumentExpression);
  }

  if (isPrefixUnaryExpression(node)) {
    return node.operator !== SyntaxKind.PlusPlusToken && node.operator !== SyntaxKind.MinusMinusToken && isPart(node.operand);
  }

  if (isBinaryExpression(node)) {
    const { kind } = node.operatorToken;
    return !(kind >= ASSIGNMENTS.first && kind <= ASSIGNMENTS.last) && isPart(node.left) && isPart(node.right);
  }

  if (isConditionalExpression(node)) {
    return isPart(node.condition) && isPart(node.whenTrue) && isPart(node.whenFalse);
  }

  if (isTemplateExpression(node)) {
    return node.templateSpans.every(({ expression }) => isPart(expression));
  }

  if (isArrayLiteralExpression(node)) {
    return node.elements.every(isPart);
  }

  if (isObjectLiteralExpression(node)) {
    return node.properties.every(property => isValueProperty(property, isPart));
  }

  if (isArrowFunction(node) || isFunctionExpression(node)) {
    return !findBodyLogic(node.body, sourceFile, declared, compilerOptions);
  }

  if (isCallExpression(node) || isNewExpression(node)) {
    return isKnownFunction(node.expression, sourceFile) && (node.arguments?.every(isPart) ?? true);
  }

  return false;
}

/**
 * Tells whether a node is a literal.
 *
 * @param node - The node.
 * @returns `true` for a literal.
 */
function isLiteral(node: Node): boolean {
  return isStringLiteral(node)
    || isNoSubstitutionTemplateLiteral(node)
    || isNumericLiteral(node)
    || isRegularExpressionLiteral(node)
    || node.kind === SyntaxKind.BigIntLiteral
    || node.kind === SyntaxKind.TrueKeyword
    || node.kind === SyntaxKind.FalseKeyword
    || node.kind === SyntaxKind.NullKeyword;
}

/**
 * Tells whether a property of an object literal only computes a value.
 *
 * @param property - The property.
 * @param isPart - Tells whether an expression only computes a value.
 * @returns `true` when it only computes a value.
 */
function isValueProperty(property: ObjectLiteralElementLike, isPart: (part: Expression) => boolean): boolean {
  if (isPropertyAssignment(property)) {
    return isPart(property.initializer);
  }

  if (isSpreadAssignment(property)) {
    return isPart(property.expression);
  }

  return isShorthandPropertyAssignment(property) && isPart(property.name);
}

/**
 * Tells whether a function only computes a value: one of ECMAScript, reached from its global (`Math.max`,
 * `Object.keys`), or one of `@xaendar/core` reading one.
 *
 * @param callee - The expression of the function.
 * @param sourceFile - The file of the call.
 * @returns `true` when it only computes a value.
 */
function isKnownFunction(callee: Expression, sourceFile: SourceFile): boolean {
  let root = callee;
  while (isPropertyAccessExpression(root)) {
    root = root.expression;
  }

  if (!isIdentifier(root)) {
    return false;
  }

  return Object.hasOwn(globals.builtin, root.text) || VALUE_FUNCTIONS.has(getCoreImport(root, sourceFile)!);
}

/**
 * Finds what a body runs in the browser: the effects and the components it creates, the globals only the browser has it
 * reads, guarded by `typeof` too, since a value read there differs from the one of the server, and the signals of a
 * module, which the rest of the page writes.
 *
 * What only the template calls runs on the server: the calls to other functions are left alone, since they compute what
 * the template renders.
 *
 * @param body - The body.
 * @param sourceFile - The file of the body.
 * @param declared - The names the file declares, which are not globals.
 * @param compilerOptions - Project compiler options.
 * @returns What it runs, `undefined` when it runs nothing of that.
 */
function findBodyLogic(body: Node, sourceFile: SourceFile, declared: ReadonlySet<string>, compilerOptions: CompilerOptions): string | undefined {
  let logic: string | undefined;
  const visit = (node: Node, parent: Node): void => {
    if (isTypeNode(node)) {
      return;
    }

    if (isPropertyAccessExpression(node) && node.expression.kind === SyntaxKind.ThisKeyword && BROWSER_MEMBERS.has(node.name.text)) {
      logic = `calls ${node.name.text}`;
    } else if (isCallExpression(node) && isIdentifier(node.expression) && getCoreImport(node.expression, sourceFile) === 'effect') {
      logic = 'calls effect';
    } else if (isIdentifier(node) && isBrowserOnlyGlobal(node.text) && !declared.has(node.text) && !isMemberName(node, parent)) {
      logic = `reads the global ${node.text}`;
    }

    if (!logic) {
      forEachChild(node, child => visit(child, node));
    }
  };

  visit(body, body);
  return logic ?? (readsModuleSignal(body, sourceFile, compilerOptions) ? 'reads a signal of a module' : undefined);
}

/**
 * Tells whether an identifier names a member instead of reading a variable: `name` in `user.name` and in `{ name: 1 }`.
 *
 * @param node - The identifier.
 * @param parent - The parent of the identifier.
 * @returns `true` when it names a member.
 */
function isMemberName(node: Identifier, parent: Node): boolean {
  return (isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node;
}

/**
 * Collects the names a file declares: what it imports, its parameters, its variables and its functions, wherever they
 * are. A name declared somewhere in the file is taken for that one everywhere: `name` and `status` are globals of the
 * browser, and common names of a parameter.
 *
 * @param sourceFile - The file.
 * @returns The names.
 */
function collectDeclaredNames(sourceFile: SourceFile): ReadonlySet<string> {
  const names = new Set<string>();
  const visit = (node: Node): void => {
    if (isParameter(node) || isVariableDeclaration(node) || isBindingElement(node) || isImportSpecifier(node) || isNamespaceImport(node) || isImportClause(node) || (isFunctionLike(node) && !isClassMember(node))) {
      const { name } = node as Node & { name?: Node };
      if (name && isIdentifier(name)) {
        names.add(name.text);
      }
    }

    forEachChild(node, visit);
  };

  visit(sourceFile);
  return names;
}

/**
 * Tells whether a node is a member of a class, whose name is not a variable.
 *
 * @param node - The node.
 * @returns `true` for a method or an accessor.
 */
function isClassMember(node: Node): boolean {
  return isMethodDeclaration(node) || isGetAccessorDeclaration(node) || isSetAccessorDeclaration(node);
}
