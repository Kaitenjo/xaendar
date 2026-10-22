import { STYLE_PREPROCESSORS, type Style } from '../../../../utils/style/style';

/**
 * Generates the content of the project `package.json`.
 *
 * A project using a preprocessed stylesheet format gets its compiler (`sass` or `less`) among the
 * dev dependencies: the Xaendar plugin and Vite load it from the project.
 *
 * @param name - The project name.
 * @param version - The Xaendar packages version, read from the CLI's own package.json.
 * @param style - The stylesheet format of the project.
 * @returns The formatted JSON string.
 */
export function packageJson(name: string, version: string, style: Style): string {
  const preprocessor = STYLE_PREPROCESSORS[style];
  // Both `less` and `sass` sort between `happy-dom` and `typescript`
  const preprocessorDependency = preprocessor ? `\n    "${preprocessor.name}": "${preprocessor.version}",` : '';

  return `{
  "name": "${name}",
  "version": "0.0.1",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "xd build",
    "start": "xd start",
    "test": "xd test",
    "xd": "xd"
  },
  "dependencies": {
    "@xaendar/core": "^${version}",
    "@xaendar/signals": "^${version}",
    "@xaendar/types": "^${version}"
  },
  "devDependencies": {
    "@babel/plugin-proposal-decorators": "^8.0.2",
    "@vitest/coverage-v8": "^5.0.5",
    "@xaendar/cli": "^${version}",
    "happy-dom": "^21.0.4",${preprocessorDependency}
    "typescript": "^6.0.3",
    "vite": "^8.3.5",
    "vitest": "^5.0.5"
  }
}
`;
}
