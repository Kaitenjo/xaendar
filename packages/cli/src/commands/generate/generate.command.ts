import { Command } from 'commander';
import { generateComponent } from './component/component.command.js';

/**
 * Creates and returns the `generate` command (alias `g`) with all its
 * sub-commands registered.
 *
 * @returns The configured `generate` {@link Command} instance ready to be
 *   added to the root program.
 */
export function makeGenerateCommand(): Command {
  const generate = new Command('generate').alias('g').description('Generate Xendar building blocks');

  generate
    .command('component <name>')
    .alias('c')
    .option('-p, --path <path>', 'Custom path for the generated component (default: current directory)')
    .description('Generate a new component (creates <name>/ folder with .ts, .html, .css, .spec.ts)')
    .action((name: string, options: { path?: string }) => {
      const path = options.path || process.cwd();
      generateComponent(name, path);
    });

  return generate;
}
