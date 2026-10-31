/**
 * A fully resolved entry ready to be written to disk —
 * all content functions have already been called.
 */
export type Entry = {
  /** 
   * Discriminant tag identifying this entry as a file. 
   */
  type: 'file';
  /** 
   * The file name, including extension (e.g. `package.json`). 
   */
  name: string;
  /** 
   * File contents to write to disk. 
   */
  content: string;
} | {
  /** 
   * Discriminant tag identifying this entry as a directory. 
   */
  type: 'directory';
  /** 
   * The file name, including extension (e.g. `package.json`). 
   */
  name: string;
  /** 
   * Nested entries to create inside this directory. 
   */
  children?: Entry[];
} | {
  /** 
   * Discriminant tag instructing the scaffolder to invoke the `generate component` command. 
   */
  type: 'generateComponent';
  /** 
   * Name of the component to generate. 
   */
  name: string;
};
