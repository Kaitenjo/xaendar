import type { ProjectRendering } from './project-rendering.type';
import type { Style } from '../../../types/style.type';
import type { WorkspaceLibrary } from '../../../types/workspace-library.type';

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
  /**
   * The library of the workspace the project tests, when `xd generate library` creates both: the project imports it
   * from its sources and renders its example component.
   */
  library?: WorkspaceLibrary;
};
