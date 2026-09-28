import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile, extractSignalMembers, TypeCheckResult } from '@xaendar/compiler';
import { createShim, getLanguageService, registerRealFile } from '@xaendar/language-core';
import MagicString from 'magic-string';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createSourceFile, ScriptKind, ScriptTarget } from 'typescript';
import type { HookHandler, Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE } from '../../costants/component-filename-regex';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import { createTemplateModuleSpecifier, describeDiagnostic, extractImportedComponentPaths, getMetadataOrExtract, injectTemplate } from '../plugin-utils/plugin.utils';
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

    /*
      Parsed once from the ORIGINAL (pre-injection) text and shared across every
      component in the file, so every MagicString edit below is addressed against
      offsets that never shift - see injectTemplate() for why that matters.
    */
    const jsSourceFile = createSourceFile(componentPath, code, ScriptTarget.Latest, true, ScriptKind.JS);
    const magicString = new MagicString(code);

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

      let signals: string[];
      let typecheckBody: TypeCheckResult;

      try {
        signals = extractSignalMembers(tsSource, metadata.typescriptNodes.klass);
        /*
          Only the type-check is performed here, as it depends on the component class.
          The render function is compiled once per template in its own module (see the load hook).
        */
        typecheckBody = await compile(templateSource, {
          baseDir: dirname(templatePath),
          cache: {
            getOrInsert: getMetadataOrExtract,
            set: registerMetadata
          }
        });
      } catch (err) {
        state.logError(err, `Failed to compile template - ${templatePath}`);
        return null;
      }

      try {
        injectTemplate(magicString, jsSourceFile, first, className, createTemplateModuleSpecifier(templatePath, signals), cssContent);
        first = false;
      } catch (err) {
        state.logError(err, `Failed to inject template into component - ${componentPath}`);
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

    fixDecoratorExport(magicString, code);

    return {
      code: magicString.toString(),
      map: magicString.generateMap({ source: componentPath, includeContent: true, hires: true })
    };
  };
}

/**
 * Reorders a decorator emitted before `export` (`export @Foo class X {}`) to
 * after it (`@Foo\nexport class X {}`). Operates on the shared `MagicString`
 * via `overwrite()`, keyed off offsets found by scanning the ORIGINAL
 * (pre-injection) `code`, so the inserted newline is properly reflected in
 * the final sourcemap instead of silently shifting every following line.
 */
function fixDecoratorExport(s: MagicString, code: string): void {
  const regex = /^export\s+(@\w+[\s\S]*?)\s+(class\s)/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    s.overwrite(start, end, `${match[1]}\nexport ${match[2]}`);
  }
}
