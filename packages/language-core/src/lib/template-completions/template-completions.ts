import { type ComponentOrDirectiveMetadata, getBindingContext, resolveShimPosition, type Span } from '@xaendar/compiler';
import { type CompletionEntry, ScriptElementKind } from 'typescript';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';

/**
 * A completion proposed in a template.
 */
export type TemplateCompletion = Pick<CompletionEntry, 'name' | 'sortText'> & {
  /**
   * What the completion is: a kind of TypeScript, or `event` for an event of a component or directive.
   */
  readonly kind: CompletionEntry['kind'] | 'event';
  /**
   * The span of the template the completion replaces, `undefined` for the word at the offset.
   */
  readonly replacementSpan?: Span;
};

/**
 * Asks TypeScript the completions at an offset of a template, through the position of the shim it is mapped onto:
 * the members of the component, of an object, the variables of the template in scope.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none if the offset is not in an expression.
 */
export function getTemplateCompletions({ typeCheck, languageService, shimPath, bodyLineOffset }: TemplateAnalysis, offset: number): TemplateCompletion[] {
  const shimPosition = resolveShimPosition(typeCheck.mappingTable, offset);
  const shimFile = languageService.getProgram()?.getSourceFile(shimPath);
  if (!shimPosition || !shimFile) {
    return [];
  }

  const position = shimFile.getPositionOfLineAndCharacter(shimPosition.line + bodyLineOffset, shimPosition.character);
  const completions = languageService.getCompletionsAtPosition(shimPath, position, {});
  return completions?.entries.map(({ name, kind, sortText }) => ({ name, kind, sortText })) ?? [];
}

/**
 * Proposes the bindings of a component or directive at an offset of a template where the name of an attribute or
 * event is being written, read from the source itself, so that they are proposed while the template doesn't compile:
 * - on the name of an attribute: the inputs of the component, or of the directive whose parentheses hold it, then
 *   its events, between parentheses;
 * - on the name of an event, after its `(`: the events.
 *
 * @param metadatas - The metadata of the components and directives imported by the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none on an element that is not an imported component, `undefined` if the offset is not
 *   on the name of an attribute or event.
 */
export function getTemplateBindingCompletions(metadatas: readonly ComponentOrDirectiveMetadata[], source: string, offset: number): TemplateCompletion[] | undefined {
  const context = getBindingContext(source, offset);
  if (!context) {
    return undefined;
  }

  const { kind, tagName, directive, span } = context;
  const owner = metadatas.find(metadata => directive === undefined
    ? metadata.type === 'component' && metadata.selector === tagName
    : metadata.type === 'directive' && metadata.selector === directive);
  if (!owner) {
    return [];
  }

  const events = [...owner.events.keys()].map((name): TemplateCompletion => ({ name: kind === 'event' ? name : `(${name})`, kind: 'event', sortText: '1', replacementSpan: span }));
  if (kind === 'event') {
    return events;
  }

  const properties = [...owner.properties.keys()].map((name): TemplateCompletion => ({ name, kind: ScriptElementKind.memberVariableElement, sortText: '0', replacementSpan: span }));
  return [...properties, ...events];
}
