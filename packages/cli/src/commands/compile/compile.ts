import { Command } from 'commander';
import { compileFile } from './compile.command.js';

/**
 * Creates and returns the `compile` command (alias `co`).
 *
 * Compiles a Xendar HTML template through the full lexer → parser →
 * render-generator pipeline and writes the output to disk.
 *
 * @returns The configured `compile` {@link Command} instance ready to be
 *   added to the root program.
 */
export function makeCompileCommand(): Command {
  return new Command('compile')
    .alias('co')
    .description('Compile a Xendar HTML template into a render function')
    .argument('<input>', 'Path to the .xd.component.html template file')
    .option('-o, --output <path>', 'Path for the emitted output file (default: <input>.render.js)')
    .action((input: string, options: { output?: string }) => {
      compileFile(input, options.output);
    });
}
