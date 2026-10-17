import { createScanner, createSourceFile, isFunctionDeclaration, isIdentifier, LanguageVariant, ScriptTarget, SyntaxKind, type NodeArray, type ParameterDeclaration, type SourceFile } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { TemplateParameterNode } from '../../types/nodes/template-parameter-node.type';
import { assertDeclaredName } from '../identifier/identifier.utils';

/**
 * Text the parameters are prefixed with to be parsed as the ones of a function, followed by `) {}`.
 */
const FUNCTION_PREFIX = 'function __template(';

/**
 * Parses the parameters of a template, e.g. `item: Item, index: number` in `<template #row(item: Item, index: number)>`,
 * as the ones of a function: each one is a name followed by its type, which may be any type, imported ones included.
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
 *   optional, has a default value or a modifier, has no type, or its name is not valid or is declared twice.
 */
export function parseTemplateParameters(text: string, offset: number, template: string): TemplateParameterNode[] {
  const sourceFile = createSourceFile('__template.ts', `${FUNCTION_PREFIX}${text}) {}`, ScriptTarget.ESNext, true);
  const toSpan = (start: number, end: number): Span => ({ start: offset + start - FUNCTION_PREFIX.length, end: offset + end - FUNCTION_PREFIX.length });
  const declaration = sourceFile.statements[0];

  if (sourceFile.statements.length !== 1 || !isFunctionDeclaration(declaration) || !isParameterList(sourceFile, declaration.parameters, FUNCTION_PREFIX.length + text.length)) {
    throw new Error(`The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template #${template}(item: Item, index: number)>`, { cause: toSpan(FUNCTION_PREFIX.length, FUNCTION_PREFIX.length + text.length) });
  }

  const parameters = new Array<TemplateParameterNode>();
  const names = new Set<string>();
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

    if (questionToken || initializer) {
      throw invalid('cannot be optional or have a default value: a @render passes every argument');
    }

    if (modifiers?.length) {
      throw invalid('cannot have modifiers or decorators');
    }

    if (!type?.getWidth(sourceFile)) {
      throw invalid(`needs a type, e.g. ${name.text}: string`);
    }

    const nameSpan = toSpan(name.getStart(sourceFile), name.getEnd());
    assertDeclaredName(name.text, nameSpan, 'parameter');
    if (names.has(name.text)) {
      throw new Error(`Template "${template}" declares the parameter "${name.text}" more than once`, { cause: nameSpan });
    }

    names.add(name.text);
    parameters.push({ name: name.text, nameSpan, type: type.getText(sourceFile), typeSpan: toSpan(type.getStart(sourceFile), type.getEnd()) });
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
