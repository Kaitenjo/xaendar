import { isValidCustomElementName } from '@xaendar/common';
import { Command } from 'commander';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path/win32';
import { generateComponent } from '../generate/component/component.command';
import { buildStructure, Entry } from './structure/structure';
import { execSync } from 'node:child_process';
import { isStyle, STYLES, type Style } from '../../utils/style/style';
import { promptStyle } from './prompt-style/prompt-style';

/**
 * Creates and returns the `new` command.
 *
 * Scaffolds a new Xaendar project by generating the base directory structure
 * and initial component files. The stylesheet format is asked on the terminal
 * when `--style` is not given.
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
    .action(async (name: string, options: { path?: string, style?: string }) => {
      const workingDirectory = options.path || process.cwd();
      const projectDirectory = resolve(workingDirectory, name);

      // The root component is named after the project: its name is checked before anything is written
      if (!isValidCustomElementName(`${name}-root`)) {
        process.exit(1);
      }

      const style = await resolveStyle(options.style);
      checkAndCreateProjectDirectory(projectDirectory);
      createFiles(buildStructure({ name, style }), projectDirectory, style);
      execSync('npm i', { stdio: 'inherit', cwd: projectDirectory });
    });
}

/**
 * Resolves the stylesheet format of the project: the one given with `--style`, validated, or else the one
 * chosen on the terminal. Without an interactive terminal (e.g. in CI) nothing can be asked, and `css` is used.
 *
 * Exits the process with code `1` if the given format is not supported.
 *
 * @param style - The `--style` option, if given.
 * @returns The stylesheet format of the project.
 */
async function resolveStyle(style: string | undefined): Promise<Style> {
  if (style === undefined) {
    return process.stdin.isTTY ? promptStyle() : 'css';
  }

  if (!isStyle(style)) {
    console.error(`✖  Invalid style option: ${style}. Use one of ${STYLES.join(', ')}.`);
    process.exit(1);
  }

  return style;
}

/**
 * Checks whether the target project directory exists and is empty.
 * Creates the directory if it does not exist, or exits the process with an
 * error if it exists and is not empty.
 *
 * @param path - The absolute path to the project directory to check and create.
 */
function checkAndCreateProjectDirectory(path: string): void {
  const exists = existsSync(path);
  if (exists && readdirSync(path).length) {
    console.error(`✖  Cannot create project: target directory is not empty: ${path}`);
    process.exit(1);
  }

  if (!exists) {
    mkdirSync(path);
  }
}

/**
 * Recursively processes the provided entries to create files and directories on disk.
 * @param entries - An array of entries defining the structure to create.
 * @param basePath - The base path where the entries should be created.
 * @param style - The stylesheet format of the generated components, passed down to the component generator.
 */
function createFiles(entries: Entry[], basePath: string, style: Style): void {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    switch (entry.type) {
      case 'file':
      case undefined:
        const content = entry.content;
        writeFileSync(resolve(basePath, entry.name), content, 'utf8');
        break;

      case 'directory':
        const dirPath = resolve(basePath, entry.name);
        mkdirSync(dirPath);
        if (entry.children) {
          createFiles(entry.children, dirPath, style);
        }
        break;

      case 'generateComponent':
        generateComponent(entry.name, basePath, false, style);
        break;
    }
  };
}