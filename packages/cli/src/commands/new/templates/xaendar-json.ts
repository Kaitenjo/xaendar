/**
 * Generates the content of the project `xaendar.json` configuration file.
 *
 * @param name - The project name.
 * @param style - The CSS preprocessor chosen for the project (css, scss, less, styl).
 * @returns The formatted JSON string.
 */
export function xaendarJson(name: string, style: string): string {
  return `{
  "name": "${name}",
  "entry": "src/main.ts",
  "outDir": "dist",
  "assetsDir": "assets",
  "generate": {
    "components": {
      "style": "${style}"
    }
  }
}
`;
}
