import type { XaendarConfig } from './xaendar-config.type';

/**
 * A project found from one of its directories: the nearest `xaendar.json`.
 */
export type XaendarProject = {
  /**
   * The directory of the project, holding its `xaendar.json`.
   */
  readonly dir: string;
  /**
   * The path of its `xaendar.json`.
   */
  readonly configPath: string;
  /**
   * The content of its `xaendar.json`.
   */
  readonly config: XaendarConfig;
};
