import type { Style } from '../../../../types/style.type';
import type { ProjectRendering } from '../../types/project-rendering.type';

/**
 * Generates the content of the project `xaendar.json` configuration file.
 *
 * A project rendering its pages on the server declares its rendering on the server: its entry, without extension
 * (`src/entry-server`), and the routes `xd prerender` renders into HTML files.
 *
 * @param name - The project name.
 * @param style - The stylesheet format chosen for the project, used by `xd generate component`.
 * @param rendering - Where the project renders its pages.
 * @returns The formatted JSON string.
 */
export function xaendarJson(name: string, style: Style, rendering: Pick<ProjectRendering, 'ssr'>): string {
  // A project rendering in the browser only has no `ssr`, which JSON.stringify leaves out
  return JSON.stringify({ 
    name,
    generate: { 
      components: { 
        style 
      } 
    }, 
    ssr: rendering.ssr 
  }, null, 2);
}
