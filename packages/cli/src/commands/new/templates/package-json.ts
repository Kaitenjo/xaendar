/**
 * Generates the content of the project `package.json`.
 *
 * @param name - The project name.
 * @param version - The Xaendar packages version, read from the CLI's own package.json.
 * @returns The formatted JSON string.
 */
export function packageJson(name: string, version: string): string {
  return `{
  "name": "${name}",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "vite build",
    "start": "vite",
    "test": "vitest",
    "xd": "xd"
  },
  "dependencies": {
    "@xaendar/core": "^${version}",
    "@xaendar/signals": "^${version}",
    "@xaendar/types": "^${version}"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^4.1.7",
    "@xaendar/build-tools": "^${version}",
    "@xaendar/cli": "^${version}",
    "typescript": "^6.0.3",
    "vite": "^8.0.14",
    "vitest": "^4.1.7"
  }
}
`;
}
