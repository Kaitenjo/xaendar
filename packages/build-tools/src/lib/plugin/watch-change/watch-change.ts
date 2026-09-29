import { removeRealFile, removeVirtualFile } from '@xaendar/language-core';
import type { HookHandler, Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE, COMPONENT_HTML_FILE_RE } from '../../costants/component-filename-regex';
import { clearBaseClassDependenciesForComponent } from '../../registry/base-class-registry/base-class-registry';
import { clearImportToComponents, clearComponentToImports, findComponentsForImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, findComponentPathsForStyleDependency } from '../../registry/style-registry/style-registry';
import { findComponentPathsForTemplate, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';

/**
 * Vite plugin `watchChange` hook: dispatches deleted files to the handler tearing down the
 * registries for their kind (component TS file, template HTML file, or stylesheet).
 *
 * @param state - The shared plugin state, forwarded to the component TS file handler.
 * @returns The `watchChange` hook handler.
 */
export function createWatchChangeHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['watchChange']>> {
  return function watchChange(path, change) {
    switch (change.event) {
      case 'delete':
        if (COMPONENT_TS_FILE_RE.test(path)) {
          handleTsDelete(path, state);
        } else if (COMPONENT_HTML_FILE_RE.test(path)) {
          handleHtmlDelete(path);
        } else {
          handleStyleDelete(path);
        }
        break;
    }
  };
}

/**
 * Handles the deletion of a component `.xd.component.ts` file: removes its virtual typecheck
 * shim and every registry entry owned by it, and warns for every remaining component still
 * importing it (their shim is removed too, so the stale import is reported as a diagnostic).
 *
 * @param componentPath - Absolute path of the deleted component file.
 * @param state - The shared plugin state, used to log the warning about dangling imports.
 */
export function handleTsDelete(componentPath: string, state: XaendarPluginState) {
  removeVirtualFile(`${componentPath}.__typecheck__.ts`);
  removeRealFile(componentPath);
  removeComponentPath(componentPath);
  clearStyleDependenciesForComponent(componentPath);
  clearBaseClassDependenciesForComponent(componentPath);
  clearMetadataForFile(componentPath);

  const components = findComponentsForImport(componentPath);
  for (const componentId of components) {
    removeVirtualFile(`${componentId}.__typecheck__.ts`);
    state.logError('', `Component "${componentPath}" was deleted but is still imported by "${componentId}". Update its @import statement.`);
  }

  clearImportToComponents(componentPath);
  clearComponentToImports(componentPath);
}

/**
 * Handles the deletion of a component template `.xd.component.html` file: removes the virtual
 * typecheck shim of every component using it.
 *
 * @param id - Absolute path of the deleted template file.
 */
export function handleHtmlDelete(id: string) {
  const componentIds = findComponentPathsForTemplate(id);
  if (componentIds) {
    for (const componentId of componentIds) {
      removeVirtualFile(`${componentId}.__typecheck__.ts`);
    }
  }
}

/**
 * Handles the deletion of a stylesheet file: removes the virtual typecheck shim of every
 * component depending on it.
 *
 * @param stylePath - Absolute path of the deleted style file.
 */
export function handleStyleDelete(stylePath: string) {
  const componentPaths = findComponentPathsForStyleDependency(stylePath);
  if (componentPaths) {
    for (const componentPath of componentPaths) {
      removeVirtualFile(`${componentPath}.__typecheck__.ts`);
    }
  }
}