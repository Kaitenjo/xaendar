import type { ProjectRendering } from './project-rendering.type';
import type { Style } from '../../../types/style.type';

/**
 * The context required to resolve all file contents when scaffolding
 * a new Xaendar project.
 */
export type ProjectContext = {
  /** 
   * The project name as provided by the user (e.g. `my-app`).
   */
  name: string;
  /**
   * The stylesheet format chosen for the project.
   */
  style: Style;
  /**
   * Where the project renders its pages: in the browser only, or on the server too (`xd new --ssr`).
   */
  rendering: ProjectRendering;
};
