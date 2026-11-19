/**
 * A piece of the code rendering a node on the server. The generator joins the pieces of a function in order: the static
 * HTML and the expressions computing HTML that follow each other are pushed into the output together, with a single
 * `out.push(…)`, and a statement is written on its own.
 */
export type ServerCodePiece = {
  /**
   * HTML known when the template is compiled, already escaped, written as it is.
   */
  readonly html: string
} | {
  /**
   * An expression computing HTML, already escaped.
   */
  readonly value: string
} | {
  /**
   * A statement, e.g. the call of a runtime helper or of the function rendering a block, whose lines are separated by
   * line feeds.
   */
  readonly statement: string
};
