/**
 * A step of the release run by the `deploy` schematic: a command run in a process of its own, as the steps of an npm
 * script joined by `&&`, the release stopping at the first one failing.
 */
export type DeployStep = {
  /**
   * What the step does, printed before it runs.
   */
  label: string;

  /**
   * The executable: `node` (the running one) for the schematics and the tools of the repository, `npm` otherwise.
   */
  command: 'node' | 'npm';

  /**
   * The arguments of the command.
   */
  args: string[];

  /**
   * The directory the command runs in.
   */
  cwd: string;
};
