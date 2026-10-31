import type { ASTNode, ComponentOrDirectiveMetadata, SymbolImport, TypeCheckResult } from '@xaendar/compiler';
import type { LanguageService } from 'typescript';
import type { TemplateImport } from './template-import.type';

/**
 * The result of the analysis of a template that could be parsed (see {@link analyzeTemplate}), whose `errors`
 * may not be empty.
 */
export type TemplateAnalysis = {
  /**
   * The path of the template.
   */
  readonly templatePath: string;
  /**
   * The source of the template analyzed.
   */
  readonly source: string;
  /**
   * The top-level nodes of the template.
   */
  readonly ast: readonly ASTNode[];
  /**
   * The components and directives imported by the template.
   */
  readonly imports: readonly TemplateImport[];
  /**
   * The metadata of the components and directives imported by the template.
   */
  readonly metadatas: readonly ComponentOrDirectiveMetadata[];
  /**
   * The other symbols imported by the template: functions, constants, enums, classes, types, namespaces.
   */
  readonly symbols: readonly SymbolImport[];
  /**
   * The errors of the template that don't prevent the analysis: the modules and symbols of the `@import` statements
   * that cannot be resolved, and the nodes failing type-checking, which the type-check body leaves out. A
   * `TemplateError` when the error points to a part of the template.
   */
  readonly errors: readonly Error[];
  /**
   * The type-check body generated from the template, with the table mapping it to the template.
   */
  readonly typeCheck: TypeCheckResult;
  /**
   * The path of the shim wrapping the type-check body.
   */
  readonly shimPath: string;
  /**
   * The line of the shim the type-check body starts at.
   */
  readonly bodyLineOffset: number;
  /**
   * The LanguageService of the project the template belongs to, which sees the shim.
   */
  readonly languageService: LanguageService;
  /**
   * The paths of the files whose change may change the analysis: the files of the components using the template,
   * of the components and directives it imports, and of their base classes.
   */
  readonly dependencies: ReadonlySet<string>;
};
