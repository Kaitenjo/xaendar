import { STYLE_PREPROCESSORS } from '../../../../utils/style/style';
import type { Style } from '../../../../types/style.type';
import type { ProjectRendering } from '../../types/project-rendering.type';

/**
 * Generates the content of the project `package.json`, its scripts and dependencies sorted by name.
 *
 * A project using a preprocessed stylesheet format gets its compiler (`sass` or `less`) among the
 * dev dependencies: the Xaendar plugin and Vite load it from the project.
 *
 * The rendering of the project adds its own scripts and dependencies: for a project rendering its pages on the server,
 * `@xaendar/ssr`, the types of Node for its `server.ts`, and the scripts running the server (`serve`) and rendering the
 * routes into HTML files (`prerender`).
 *
 * @param name - The project name.
 * @param version - The Xaendar packages version, read from the CLI's own package.json.
 * @param style - The stylesheet format of the project.
 * @param rendering - Where the project renders its pages.
 * @returns The formatted JSON string.
 */
export function packageJson(name: string, version: string, style: Style, rendering: Pick<ProjectRendering, 'scripts' | 'packages' | 'devDependencies'>): string {
  const dependencies: Record<string, string> = {
    '@xaendar/core': `^${version}`,
    '@xaendar/signals': `^${version}`,
    '@xaendar/types': `^${version}`
  };

  if (rendering.packages?.length) {
    for (let i = 0; i < rendering.packages.length; i++) {
      dependencies[rendering.packages[i]] = `^${version}`;
    }
  }

  const devDependencies: Record<string, string> = Object.assign({
    '@babel/plugin-proposal-decorators': '^8.0.2',
    '@vitest/coverage-v8': '^5.0.5',
    '@xaendar/cli': `^${version}`,
    'happy-dom': '^21.0.4',
    'typescript': '^6.0.3',
    'vite': '^8.3.5',
    'vitest': '^5.0.5'
  }, rendering.devDependencies);

  const preprocessor = STYLE_PREPROCESSORS[style];
  if (preprocessor) {
    devDependencies[preprocessor.name] = preprocessor.version;
  }

  const scripts = Object.assign({ 
    build: 'xd build', 
    start: 'xd start', 
    test: 'xd test', 
    xd: 'xd' 
  }, rendering.scripts);

  return `${JSON.stringify({
    name,
    version: '0.0.1',
    type: 'module',
    private: true,
    scripts: sortByName(scripts),
    dependencies: sortByName(dependencies),
    devDependencies: sortByName(devDependencies)
  }, null, 2)}\n`;
}

/**
 * Copies a map of names to values with its names sorted, as npm writes the dependencies.
 *
 * @param record - The names and their values.
 * @returns The copy, sorted by name.
 */
function sortByName(record: Readonly<Record<string, string>>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const names = Object.keys(record).sort();
  for (let i = 0; i < names.length; i++) {
    sorted[names[i]] = record[names[i]];
  }

  return sorted;
}
