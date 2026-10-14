import { extractComponentsMetadataFromSourceFile } from '@xaendar/compiler';
import { normalizeFileName, readDocument } from '@xaendar/language-core';
import fg from 'fast-glob';
import { dirname, resolve } from 'node:path';
import { createSourceFile, ScriptTarget } from 'typescript';

/**
 * Suffix of the files declaring the components.
 */
export const COMPONENT_FILE_SUFFIX = '.xd.component.ts';

/**
 * Bidirectional template ↔ component index of a workspace, so that a template can be type-checked against the
 * classes using it wherever they live: built once at startup (see `build`) and kept up to date with the files
 * watched by the client and the component files open in the editor (see `index`).
 */
export class TemplateRegistry {
  /**
   * The components using each template, keyed by the normalized path of the template: the file of each component
   * mapped to the names of its classes using the template.
   */
  private readonly _components = new Map<string, Map<string, string[]>>();
  /**
   * The templates used by each component file, keyed by its normalized path.
   */
  private readonly _templates = new Map<string, Set<string>>();

  /**
   * Indexes every component file of the workspace folders.
   *
   * @param workspaceRoots - The absolute paths of the workspace folders.
   */
  public async build(workspaceRoots: readonly string[]): Promise<void> {
    for (let i = 0; i < workspaceRoots.length; i++) {
      const root = workspaceRoots[i];
      const componentFiles = await fg(`**/*${COMPONENT_FILE_SUFFIX}`, { cwd: root, absolute: true, ignore: ['**/node_modules/**', '**/dist/**'] });
      for (let j = 0; j < componentFiles.length; j++) {
        await this.index(componentFiles[j]);
      }
    }
  }

  /**
   * Indexes (or indexes again) a component file, reading the `templateUrl` of each component it declares: to be
   * called when the file is created or changed, also while unsaved, since a `templateUrl` may have changed.
   *
   * @param componentPath - The absolute path of the component file.
   */
  public async index(componentPath: string): Promise<void> {
    this.remove(componentPath);

    const text = readDocument(componentPath);
    if (text === undefined) {
      return;
    }

    let metadatas: Awaited<ReturnType<typeof extractComponentsMetadataFromSourceFile>>;
    try {
      metadatas = await extractComponentsMetadataFromSourceFile(createSourceFile(componentPath, text, ScriptTarget.Latest, true));
    } catch {
      // A component whose metadata cannot be extracted is reported by its templates when it is fixed
      return;
    }

    const templates = new Set<string>();
    for (const [className, { templateUrl }] of metadatas ?? []) {
      const templateKey = normalizeFileName(resolve(dirname(componentPath), templateUrl));
      const components = this._components.getOrInsertComputed(templateKey, () => new Map());
      components.getOrInsertComputed(componentPath, () => []).push(className);
      templates.add(templateKey);
    }

    this._templates.set(normalizeFileName(componentPath), templates);
  }

  /**
   * Removes a component file from the index, e.g. when it is deleted.
   *
   * @param componentPath - The absolute path of the component file.
   */
  public remove(componentPath: string): void {
    const componentKey = normalizeFileName(componentPath);
    for (const templateKey of this._templates.get(componentKey) ?? []) {
      const components = this._components.get(templateKey)!;
      const fileNames = [...components.keys()].filter(fileName => normalizeFileName(fileName) === componentKey);
      for (let j = 0; j < fileNames.length; j++) {
        components.delete(fileNames[j]);
      }

      if (!components.size) {
        this._components.delete(templateKey);
      }
    }

    this._templates.delete(componentKey);
  }

  /**
   * Returns the components using a template.
   *
   * @param templatePath - The absolute path of the template.
   * @returns The file of each component mapped to the names of its classes using the template, `undefined` if no component uses it.
   */
  public resolve(templatePath: string): ReadonlyMap<string, readonly string[]> | undefined {
    return this._components.get(normalizeFileName(templatePath));
  }
}
