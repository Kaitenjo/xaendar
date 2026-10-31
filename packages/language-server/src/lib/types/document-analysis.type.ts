import type { TemplateAnalysisResult } from '@xaendar/language-core';

/**
 * The analysis of an open template, together with the version of the document it was made from.
 */
export type DocumentAnalysis = {
  /**
   * The version of the document analyzed.
   */
  readonly version: number;
  /**
   * The analysis.
   */
  readonly result: TemplateAnalysisResult;
};
