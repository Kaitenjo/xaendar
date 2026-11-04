import type { LineMapping } from './line-mapping.type';

/** 
 * A single line of generated TypeScript together with optional source-map entries. 
 */
export type Line = {
  /** 
   * The generated TypeScript text for this line (no trailing newline). 
   */
  text: string;
  /** 
   * Source-map entries for tokens on this line; absent when the line has no mappable spans. 
   */
  mappings?: LineMapping[];
}
