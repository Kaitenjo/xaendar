import type { Style } from '../../../../utils/style/style';

/**
 * Generates the content of the project `xaendar.json` configuration file.
 *
 * @param name - The project name.
 * @param style - The stylesheet format chosen for the project, used by `xd generate component`.
 * @returns The formatted JSON string.
 */
export function xaendarJson(name: string, style: Style): string {
  return `{
  "name": "${name}",
  "generate": {
    "components": {
      "style": "${style}"
    }
  }
}`;
}
