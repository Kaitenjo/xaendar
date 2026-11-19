import type { XaendarConfig } from './xaendar-config.type';

/**
 * A `xaendar.json` read from the disk.
 */
export type XaendarConfigFile = {
  /**
   * The content of the file.
   */
  readonly config: XaendarConfig;
  /**
   * The directory of the file, which the paths it holds are relative to.
   */
  readonly dir: string;
};
