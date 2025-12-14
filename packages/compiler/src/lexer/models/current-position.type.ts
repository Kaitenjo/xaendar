/**
 * Represents a cursor position in a text document.
 */
export class CursorPosition {
  /**
   * Zero-based row index.
   */
  public row = 0;
  /**
   * Zero-based column index.
   */
  public column = 0;
  
  /**
   * Increment by 1 Row Index
   * Reset Column Index
   */
  public newLine(): void {
    this.row++;
    this.column = 0;
  }
}
