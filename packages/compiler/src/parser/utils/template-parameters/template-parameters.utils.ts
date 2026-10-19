import { createScanner, createSourceFile, isFunctionDeclaration, isIdentifier, LanguageVariant, ScriptTarget, SyntaxKind, type NodeArray, type ParameterDeclaration, type SourceFile } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { TemplateParameterNode } from '../../types/nodes/template-parameter-node.type';
import { validateExpression } from '../expression-validator/expression-validator';
import { assertDeclaredName } from '../identifier/identifier.utils';

/**
 * Text the parameters are prefixed with to be parsed as the ones of a function, followed by `) {}`.
 */
const FUNCTION_PREFIX = 'function __template(';

/**
 * Parses the parameters of a template, e.g. `item: Item, index: number` in `<template row(item: Item, index: number)>`,
 * as the ones of a function: each one is a name followed by its type, which may be any type, imported ones included.
 * A parameter may be optional (`count?: number`), or have a default value, with its type (`dense: boolean = false`) or
 * typed by the value (`dense = false`): its argument may then be left out, so only the last parameters may be so.
 * The types are not validated here: the type-check reports their errors.
 *
 * @example
 * parseTemplateParameters('item: Item', 20, 'row');  // [{ name: 'item', nameSpan: { start: 20, end: 24 }, type: 'Item', typeSpan: { start: 26, end: 30 } }]
 *
 * @param text - The text of the parameters, without the parentheses enclosing them.
 * @param offset - The offset of the template the text starts at.
 * @param template - The name of the template, used in the error messages.
 * @returns The parameters, with their spans in the template.
 * @throws If the text is not a list of parameters, or a parameter destructures its value, is a rest parameter, is
 *   both optional and with a default value, has a modifier, has neither a type nor a default value (an optional one
 *   needs a type), is required after an optional one or one with a default value, its default value is not a valid
 *   expression, or its name is not valid or is declared twice.
 */
export function parseTemplateParameters(text: string, offset: number, template: string): TemplateParameterNode[] {
  const sourceFile = createSourceFile('__template.ts', `${FUNCTION_PREFIX}${text}) {}`, ScriptTarget.ESNext, true);
  const toSpan = (start: number, end: number): Span => ({ start: offset + start - FUNCTION_PREFIX.length, end: offset + end - FUNCTION_PREFIX.length });
  const declaration = sourceFile.statements[0];

  if (sourceFile.statements.length !== 1 || !isFunctionDeclaration(declaration) || !isParameterList(sourceFile, declaration.parameters, FUNCTION_PREFIX.length + text.length)) {
    throw new Error(`The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template ${template}(item: Item, index: number)>`, { cause: toSpan(FUNCTION_PREFIX.length, FUNCTION_PREFIX.length + text.length) });
  }

  const parameters = new Array<TemplateParameterNode>();
  const names = new Set<string>();
  // The parameter after which the arguments may be left out, the first optional one or with a default value
  let omittable: ParameterDeclaration | undefined;
  for (let i = 0; i < declaration.parameters.length; i++) {
    const parameter = declaration.parameters[i];
    const { name, type, dotDotDotToken, questionToken, initializer, modifiers } = parameter;
    const invalid = (reason: string): Error => new Error(`The parameter '${parameter.getText(sourceFile)}' of template "${template}" ${reason}`, { cause: toSpan(parameter.getStart(sourceFile), parameter.getEnd()) });

    if (!isIdentifier(name)) {
      throw invalid('cannot destructure its value: name it, and read its properties in the content of the template');
    }

    if (dotDotDotToken) {
      throw invalid('cannot be a rest parameter: a template takes a fixed number of arguments');
    }

    if (questionToken && initializer) {
      throw invalid('cannot be both optional and with a default value: the default value already makes it optional');
    }

    if (modifiers?.length) {
      throw invalid('cannot have modifiers or decorators');
    }

    // A written type is empty when only its `:` is
    const typed = type?.getWidth(sourceFile) ? type : undefined;
    if (!typed && (type || !initializer)) {
      throw invalid(questionToken ? `needs a type, e.g. ${name.text}?: string` : `needs a type or a default value, e.g. ${name.text}: string or ${name.text} = ''`);
    }

    if (questionToken || initializer) {
      omittable ??= parameter;
    } else if (omittable) {
      throw invalid(`must be optional or have a default value, as '${omittable.getText(sourceFile)}' before it: a @render leaves out only the last arguments`);
    }

    const nameSpan = toSpan(name.getStart(sourceFile), name.getEnd());
    assertDeclaredName(name.text, nameSpan, 'parameter');
    if (names.has(name.text)) {
      throw new Error(`Template "${template}" declares the parameter "${name.text}" more than once`, { cause: nameSpan });
    }

    names.add(name.text);
    const node: TemplateParameterNode = { name: name.text, nameSpan };
    if (typed) {
      node.type = typed.getText(sourceFile);
      node.typeSpan = toSpan(typed.getStart(sourceFile), typed.getEnd());
    }

    if (questionToken) {
      node.optional = true;
    }

    if (initializer) {
      const { start } = toSpan(initializer.getStart(sourceFile), initializer.getEnd());
      node.initializer = validateExpression(initializer.getText(sourceFile), start).node;
    }

    parameters.push(node);
  }

  return parameters;
}

/**
 * Tells whether the parameters of a function were parsed from a well-formed list, ending where expected: TypeScript
 * recovers from a missing or a doubled comma, or a `;` between two parameters, which the list cannot hold.
 *
 * @param sourceFile - The source file of the function.
 * @param parameters - The parameters of the function.
 * @param end - The offset the list is expected to end at, before the `)` closing it.
 * @returns `true` if a single comma separates each parameter from the next one, a comma can only trail the last one,
 *   and only whitespace and comments surround them up to `end`.
 */
function isParameterList(sourceFile: SourceFile, parameters: NodeArray<ParameterDeclaration>, end: number): boolean {
  let start = FUNCTION_PREFIX.length;
  for (let i = 0; i < parameters.length; i++) {
    if (countCommas(sourceFile.text, start, parameters[i].getStart(sourceFile)) !== (i ? 1 : 0)) {
      return false;
    }

    start = parameters[i].getEnd();
  }

  const trailing = countCommas(sourceFile.text, start, end);
  return trailing === 0 || (trailing === 1 && !!parameters.length);
}

/**
 * Counts the commas in a part of a text holding only commas, whitespace and comments.
 *
 * @param text - The text.
 * @param start - The offset the part starts at.
 * @param end - The offset the part ends at, excluded.
 * @returns The number of commas, `undefined` if the part holds anything else.
 */
function countCommas(text: string, start: number, end: number): number | undefined {
  const scanner = createScanner(ScriptTarget.ESNext, true, LanguageVariant.Standard, text.slice(start, end));
  let commas = 0;
  for (let token = scanner.scan(); token !== SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (token !== SyntaxKind.CommaToken) {
      return undefined;
    }

    commas++;
  }

  return commas;
}
