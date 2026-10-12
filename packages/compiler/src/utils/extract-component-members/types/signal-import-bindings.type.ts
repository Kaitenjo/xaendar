/**
 * Local names the signal modules are imported under in a file.
 */
export type SignalImportBindings = {
  /**
   * Local names of the named imports (`import { signal } from '...'`).
   */
  named: Set<string>;
  /**
   * Local names of the namespace imports (`import * as signals from '...'`).
   */
  namespaces: Set<string>;
}
