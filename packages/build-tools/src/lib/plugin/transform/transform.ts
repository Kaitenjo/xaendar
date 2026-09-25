import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile, extractSignalMembers, TypeCheckResult } from '@xaendar/compiler';
import { createShim, getLanguageService, registerRealFile } from '@xaendar/language-core';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createSourceFile, ScriptTarget } from 'typescript';
import type { HookHandler, Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE } from '../../costants/component-filename-regex';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import { describeDiagnostic, extractImportedComponentPaths, getMetadataOrExtract, injectFunctions } from '../plugin-utils/plugin.utils';
import { compileStyle } from '../style/compile-style';

export function createTransformHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['transform']>> {
  return async function transform(this, code, componentPath) {
    if (!COMPONENT_TS_FILE_RE.test(componentPath)) {
      return code;
    }

    const tsSource = createSourceFile(componentPath, await readFile(componentPath, 'utf8'), ScriptTarget.Latest, true);
    const metadatas = await extractComponentsMetadataFromSourceFile(tsSource);
    if (!metadatas?.size) {
      /*
        The file match a xendar component file but no component metadata could be extracted.
        We can safely return the original code as no operation should be performed
      */
      return code;
    }

    // clear stale keys from a prior edit (e.g. a renamed className/selector) before re-registering
    clearMetadataForFile(componentPath);
    clearComponentToImports(componentPath);
    clearStyleDependenciesForComponent(componentPath);
    removeComponentPath(componentPath);

    let first = true;
    for (const [className, metadata] of metadatas.entries()) {
      // TODO className is not unique, we can't use it as a key for the metadata cache
      registerMetadata(className, metadata);

      const { selectors, styleUrl, templateUrl } = metadata;
      for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        if (!isValidCustomElementName(selector)) {
          state.logError('', `Invalid custom element name "${selector}" in component ${componentPath}`);
          return null;
        }
      }

      const folder = dirname(componentPath);
      const templatePath = resolve(folder, templateUrl);
      if (!templatePath || !state.host.fileExists(templatePath)) {
        this.warn(`Could not find template at ${templatePath}`);
        return null;
      }

      this.addWatchFile(templatePath);
      registerTemplatePath(templatePath, componentPath);
      // ! is a safe assertion because we check if the fileExists before reading it
      const templateSource = state.host.readFile(templatePath)!;

      for (const importedPath of extractImportedComponentPaths(templateSource, dirname(templatePath))) {
        if (state.host.fileExists(importedPath)) {
          this.addWatchFile(importedPath);
          registerImport(importedPath, componentPath);
        }
      }

      let cssContent: string | undefined;
      if (styleUrl) {
        const stylePath = resolve(folder, styleUrl);
        const styleResult = compileStyle(stylePath, state.host);
        cssContent = styleResult.cssText;

        for (const dependencyPath of styleResult.dependencyPaths) {
          this.addWatchFile(dependencyPath);
          registerStyleDependency(dependencyPath, componentPath);
        }
      }

      let compiledMethods: string | undefined;
      let typecheckBody: TypeCheckResult | undefined;
      const varName = cssContent ? `__${className}_sheet` : undefined;

      try {
        // Todo Create a dedicated cache to store signal values metadata otherwise this will be done every time file is saved
        const signals = extractSignalMembers(tsSource, metadata.typescriptNodes.klass);
        const result = await compile(templateSource, {
          baseDir: dirname(templatePath),
          cssVariableName: varName,
          signals,
          cache: {
            getOrInsert: getMetadataOrExtract,
            set: registerMetadata
          }
        });
        compiledMethods = result.javascript;
        typecheckBody = result.typescript;
      } catch (err) {
        state.logError(err, `Failed to compile template - ${templatePath}`);
        return null;
      }

      try {
        code = injectFunctions(code, first, compiledMethods, className, varName, cssContent);
        first = false;
      } catch (err) {
        state.logError(err, `Failed to inject functions into component - ${componentPath}`);
        return null;
      }

      registerRealFile(componentPath);

      const shim = createShim(new Map([[componentPath, [className]]]), typecheckBody);
      const languageService = getLanguageService(state.compilerOptions);
      const diagnostics = languageService.getSemanticDiagnostics(shim.path);

      for (let i = 0; i < diagnostics.length; i++) {
        state.logError('', `Failed to compile template - ${templatePath}\n${describeDiagnostic(templateSource, diagnostics[i], shim.bodyLineOffset, typecheckBody.mappingTable)}`);
      }

      // After logging every diagnostics we have to return null to raise an error
      if (diagnostics.length) {
        return null;
      }
    }

    return {
      code: fixDecoratorExport(code)
    };
  };
}

function fixDecoratorExport(code: string): string {
  return code.replace(/^export\s+(@\w+[\s\S]*?)\s+(class\s)/gm, '$1\nexport $2');
}
