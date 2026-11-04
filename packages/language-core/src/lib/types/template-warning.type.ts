import type { TemplateDiagnostic } from './template-diagnostic.type';

/**
 * Something a template compiles with, but does not do what it says given where the project renders (see
 * `getTemplateWarnings`).
 */
export type TemplateWarning = Pick<TemplateDiagnostic, 'span' | 'message'>;
