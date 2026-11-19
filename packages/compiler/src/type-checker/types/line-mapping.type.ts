import type { Span } from '../../types/span.type';

/** 
 * Maps a column range in the generated shim back to its originating span in the template source. 
 */
export type LineMapping = {
  /** 
   * Inclusive start column in the generated line. 
   */
  columnStart: number;
  /** 
   * Exclusive end column in the generated line. 
   */
  columnEnd: number;
  /** 
   * Corresponding span in the original template source. 
   */
  original: Span;
}
