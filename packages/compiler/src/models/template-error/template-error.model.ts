import type { Span } from '../../types/span.type';

/**
 * Error raised by the lexer, the parser or the type checker for a template that cannot be compiled.
 *
 * Its `message` is the same text printed in the terminal (the stage prefix, the position and the excerpt of the
 * template), while `span` and `detail` let editor tooling report the error right where it is in the template.
 */
export class TemplateError extends Error {
  /**
   * Creates a template error.
   *
   * @param message - The formatted message: the stage prefix, the position and the excerpt of the template.
   * @param span - The span of the template the error refers to.
   * @param detail - The description of the error alone, without prefix, position and excerpt.
   */
  constructor(message: string, public readonly span: Span, public readonly detail: string) {
    super(message);
    this.name = 'TemplateError';
    /*
      The error points to the template, not to the compiler code raising it: without a stack,
      the logs printing an error together with its stack print just the message, as they do for a string.
    */
    this.stack = '';
  }

  /**
   * Returns the formatted message, so that interpolating the error prints exactly what a thrown string would.
   *
   * @returns The formatted message.
   */
  public override toString(): string {
    return this.message;
  }
}
