import type { Span } from '@xaendar/compiler';
import type { TemplateDefinition } from './template-definition.type';

/**
 * A part of a template whose definition is known without asking TypeScript, e.g. the tag name of a component.
 */
export type DefinitionTarget = {
  /**
   * The span of the part in the template.
   */
  readonly span: Span;
  /**
   * The definitions of the part.
   */
  readonly definitions: readonly TemplateDefinition[];
};
