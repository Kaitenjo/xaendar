import { removeRealFile, removeVirtualFile } from '@xaendar/language-core';
import type { Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE, COMPONENT_HTML_FILE_RE } from '../../costants/component-filename-regex';
import { clearImportToComponents, clearComponentToImports, findComponentsForImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile } from '../../registry/metadata-registry/metadata-registry';
import { findComponentPathsForTemplate, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';

export function createWatchChangeHook(state: XaendarPluginState): NonNullable<Plugin['watchChange']> {
  return function watchChange(id, change) {
    switch (change.event) {
      case 'delete':
        if (COMPONENT_TS_FILE_RE.test(id)) {
          handleTsDelete(id, state);
        } else if (COMPONENT_HTML_FILE_RE.test(id)) {
          handleHtmlDelete(id);
        }
        break;
    }
  };
}

export function handleTsDelete(id: string, state: XaendarPluginState) {
  removeVirtualFile(`${id}.__typecheck__.ts`);
  removeRealFile(id);
  removeComponentPath(id);
  clearMetadataForFile(id);

  const components = findComponentsForImport(id);
  for (const componentId of components) {
    removeVirtualFile(`${componentId}.__typecheck__.ts`);
    state.logError('', `Component "${id}" was deleted but is still imported by "${componentId}". Update its @import statement.`);
  }

  clearImportToComponents(id);
  clearComponentToImports(id);
}

export function handleHtmlDelete(id: string) {
  const componentIds = findComponentPathsForTemplate(id);
  if (componentIds) {
    for (const componentId of componentIds) {
      removeVirtualFile(`${componentId}.__typecheck__.ts`);
    }
  }
}