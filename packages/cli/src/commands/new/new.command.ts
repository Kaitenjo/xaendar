import { isValidCustomElementName } from '@xaendar/common';
import { Command } from 'commander';
import { resolve } from 'node:path/win32';
import { buildStructure } from './structure/structure';
import { execSync } from 'node:child_process';
import { STYLES } from '../../utils/style/style';
import { checkAndCreateProjectDirectory, createFiles, resolveStyle } from '../../utils/scaffold/scaffold.utils';
import { CLIENT_RENDERING, SERVER_RENDERING } from './rendering/rendering';

/**
 * Creates and returns the `new` command.
 *
 * Scaffolds a new Xaendar project by generating the base directory structure
 * and initial component files. The stylesheet format is asked on the terminal
 * when `--style` is not given. With `--ssr`, the project renders its pages on
 * the server, with a server of its own and the entry rendering a page.
 *
 * @returns The configured `new` {@link Command} instance ready to be
 *   added to the root program.
 */
export function newCommand(): Command {
  return new Command('new')
    .description('Scaffold a new Xaendar project')
    .argument('<name>', 'Name of the project to create')
    .option('-p, --path <path>', 'Custom path for the generated project (default: current directory)')
    .option('-s, --style <style>', `Stylesheet format of the components (${STYLES.join(', ')})`)
    .option('--ssr', 'Render the pages on the server, with Declarative Shadow DOM')
    .action(async (name: string, options: { path?: string, style?: string, ssr?: boolean }) => {
      const workingDirectory = options.path || process.cwd();
      const projectDirectory = resolve(workingDirectory, name);

      // The root component is named after the project: its name is checked before anything is written
      if (!isValidCustomElementName(`${name}-root`)) {
        process.exit(1);
      }

      const style = await resolveStyle(options.style);
      checkAndCreateProjectDirectory(projectDirectory);
      createFiles(buildStructure({ name, style, rendering: options.ssr ? SERVER_RENDERING : CLIENT_RENDERING }), projectDirectory, style);
      execSync('npm i', { stdio: 'inherit', cwd: projectDirectory });
    });
}
