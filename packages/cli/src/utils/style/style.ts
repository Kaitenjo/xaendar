import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * The stylesheet formats a project can use, which are also the extensions of its stylesheets.
 */
export const STYLES = ['css', 'scss', 'sass', 'less'] as const;

/**
 * A stylesheet format a project can use.
 */
export type Style = (typeof STYLES)[number];

/**
 * The package compiling each preprocessed format, with the version installed in a new project.
 */
export const STYLE_PREPROCESSORS: Partial<Record<Style, { name: string, version: string }>> = {
  scss: { name: 'sass', version: '^1.106.1' },
  sass: { name: 'sass', version: '^1.106.1' },
  less: { name: 'less', version: '^4.9.1' }
};

/**
 * Checks whether a value is one of the supported stylesheet formats.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a {@link Style}.
 */
export function isStyle(value: string): value is Style {
  return (STYLES as readonly string[]).includes(value);
}

/**
 * Reads the stylesheet format of the project containing `path`, from the `generate.components.style`
 * field of the nearest `xaendar.json` found walking up from it.
 *
 * Exits the process with code `1` if the field holds an unsupported format.
 *
 * @param path - A directory inside the project.
 * @returns The format of the project, `css` when no `xaendar.json` or no field is found.
 */
export function readProjectStyle(path: string): Style {
  const configPath = findXaendarJson(resolve(path));
  if (!configPath) {
    return 'css';
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8')) as { generate?: { components?: { style?: string } } };
  const style = config.generate?.components?.style;
  if (style === undefined) {
    return 'css';
  }

  if (!isStyle(style)) {
    console.error(`✖  Invalid style "${style}" in ${configPath}: use one of ${STYLES.join(', ')}.`);
    process.exit(1);
  }

  return style;
}

/**
 * Finds the nearest `xaendar.json`, walking up from a directory to the root of the file system.
 *
 * @param dir - Absolute path of the directory to start from.
 * @returns The path of the file, `undefined` if none is found.
 */
function findXaendarJson(dir: string): string | undefined {
  while (true) {
    const candidate = resolve(dir, 'xaendar.json');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }

    dir = parent;
  }
}
