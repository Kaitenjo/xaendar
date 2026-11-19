/**
 * The output of the server rendering: the HTML, in order. A part rendered later, once the structural directives deciding
 * whether it renders settle, is the promise of its own output.
 */
export type ServerOutput = Array<string | Promise<ServerOutput>>;
