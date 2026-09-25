import { removeRealFile, removeVirtualFile } from '@xaendar/language-core';
import type { Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE, COMPONENT_HTML_FILE_RE } from '../../costants/component-filename-regex';
import { clearImportToComponents, clearComponentToImports, findComponentsForImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, findComponentPathsForStyleDependency } from '../../registry/style-registry/style-registry';
import { findComponentPathsForTemplate, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';

export function createWatchChangeHook(state: XaendarPluginState): NonNullable<Plugin['watchChange']> {
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

export function handleTsDelete(componentPath: string, state: XaendarPluginState) {
  removeVirtualFile(`${componentPath}.__typecheck__.ts`);
  removeRealFile(componentPath);
  removeComponentPath(componentPath);
  clearStyleDependenciesForComponent(componentPath);
  clearMetadataForFile(componentPath);

  const components = findComponentsForImport(componentPath);
  for (const componentId of components) {
    removeVirtualFile(`${componentId}.__typecheck__.ts`);
    state.logError('', `Component "${componentPath}" was deleted but is still imported by "${componentId}". Update its @import statement.`);
  }

  clearImportToComponents(componentPath);
  clearComponentToImports(componentPath);
}

export function handleHtmlDelete(id: string) {
  const componentIds = findComponentPathsForTemplate(id);
  if (componentIds) {
    for (const componentId of componentIds) {
      removeVirtualFile(`${componentId}.__typecheck__.ts`);
    }
  }
}

export function handleStyleDelete(stylePath: string) {
  const componentPaths = findComponentPathsForStyleDependency(stylePath);
  if (componentPaths) {
    for (const componentPath of componentPaths) {
      removeVirtualFile(`${componentPath}.__typecheck__.ts`);
    }
  }
}