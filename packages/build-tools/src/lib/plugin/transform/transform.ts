import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile, extractSignalMembers, SignalMembers, TypeCheckResult } from '@xaendar/compiler';
import { createShim, getLanguageService, registerRealFile } from '@xaendar/language-core';
import MagicString from 'magic-string';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createSourceFile, ScriptKind, ScriptTarget } from 'typescript';
import type { HookHandler, Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE } from '../../costants/component-filename-regex';
import { clearDependenciesForComponent, registerDependency } from '../../registry/dependency-registry/dependency-registry';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { collectProjectDependencies } from '../../utils/project-dependencies/project-dependencies.utils';
import { claimSelectors, createStyleModuleSpecifier, createTemplateModuleSpecifier, describeDiagnostic, extractImportedComponentPaths, getMetadataOrExtract, injectTemplate } from '../plugin-utils/plugin.utils';

/**
 * Vite plugin `transform` hook: for every Xaendar component declared in a `.xd.component.ts`
 * file, resolves its template and style files, extracts its signal members, type-checks the
 * template against the component class, and injects the render function/stylesheet imports and
 * registration into the transpiled output.
 *
 * A component that cannot be compiled is left without its render function: its errors are logged and,
 * in a build, the build fails.
 *
 * @param state - The shared plugin state (compiler host, project compiler options/file names, logger).
 * @returns The `transform` hook handler.
 */
export function createTransformHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['transform']>> {
  return async function transform(this, code, componentPath) {
    if (!COMPONENT_TS_FILE_RE.test(componentPath)) {
      return code;
    }

    /**
     * Leaves the component without its render function, once its errors are reported, failing the build
     * when the plugin runs in one.
     *
     * @returns `null`, leaving the code untouched.
     */
    const fail = (): null => {
      if (state.isBuild) {
        this.error(`Failed to compile component - ${componentPath}`);
      }
      return null;
    };

    const tsSource = createSourceFile(componentPath, await readFile(componentPath, 'utf8'), ScriptTarget.Latest, true);
    const metadatas = await extractComponentsMetadataFromSourceFile(tsSource, state.compilerOptions);
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
    clearDependenciesForComponent(componentPath);
    removeComponentPath(componentPath);

    /*
      Parsed once from the ORIGINAL (pre-injection) text and shared across every
      component in the file, so every MagicString edit below is addressed against
      offsets that never shift - see injectTemplate() for why that matters.
    */
    const jsSourceFile = createSourceFile(componentPath, code, ScriptTarget.Latest, true, ScriptKind.JS);
    const magicString = new MagicString(code);

    const moduleImports = new Map<string, string>();
    for (const [className, metadata] of metadatas.entries()) {
      const { selector, styleUrl, templateUrl } = metadata;
      if (!isValidCustomElementName(selector)) {
        state.logError('', `Invalid custom element name "${selector}" in component ${componentPath}`);
        return fail();
      }

      // A selector can be defined only once at runtime: it must not be shared with any other component
      const selectorConflict = await claimSelectors(metadata);
      if (selectorConflict) {
        state.logError('', selectorConflict);
        return fail();
      }

      // TODO className is not unique, we can't use it as a key for the metadata cache
      registerMetadata(className, metadata);

      /*
        componentPath is a posix path (Vite module id), but resolve() emits backslashes on Windows:
        paths must stay posix to match the registry keys looked up from Vite ids and TS file names.
      */
      const folder = dirname(componentPath);
      const templatePath = resolvePosixPath(folder, templateUrl);
      /*
        Registered even when missing, so that the hotUpdate hook compiles the component again once the template
        is created. It is not watched until it exists: the dev server would resolve the missing file as an import
      */
      registerTemplatePath(templatePath, componentPath);
      if (!state.host.fileExists(templatePath)) {
        this.warn(`Could not find template at ${templatePath}`);
        return fail();
      }

      this.addWatchFile(templatePath);
      // ! is a safe assertion because we check if the fileExists before reading it
      const templateSource = state.host.readFile(templatePath)!;

      for (const importedPath of extractImportedComponentPaths(templateSource, dirname(templatePath))) {
        if (state.host.fileExists(importedPath)) {
          this.addWatchFile(importedPath);
          registerImport(importedPath, componentPath);
        }
      }

      /*
        The stylesheet is compiled once per style file in its own module (see the load hook),
        which watches every file it depends on.
      */
      let styleModuleSpecifier: string | undefined;
      if (styleUrl) {
        const stylePath = resolvePosixPath(folder, styleUrl);
        registerStyleDependency(stylePath, componentPath);
        styleModuleSpecifier = createStyleModuleSpecifier(stylePath);
      }

      let signals: SignalMembers;
      let typecheckBody: TypeCheckResult;

      try {
        signals = extractSignalMembers(tsSource, metadata.typescriptNodes.klass, state.compilerOptions);
        /*
          Only the type-check is performed here, as it depends on the component class.
          The render function is compiled once per template in its own module (see the load hook).
        */
        typecheckBody = await compile(templateSource, {
          baseDir: dirname(templatePath),
          cache: {
            getOrInsert: (classNameOrSelector, path) => getMetadataOrExtract(classNameOrSelector, path, state.compilerOptions),
            set: registerMetadata
          }
        });
      } catch (err) {
        state.logError(err, `Failed to compile template - ${templatePath}`);
        return fail();
      }

      /*
        The signal members also depend on the classes the component inherits from: watching their files
        re-runs the transform in build watch mode, while the registry lets the hotUpdate hook fully
        invalidate the component in dev mode, where a statically imported file is only soft-invalidated.
      */
      for (const dependency of signals.dependencies) {
        this.addWatchFile(dependency);
        registerDependency(dependency, componentPath);
      }

      try {
        injectTemplate(magicString, jsSourceFile, moduleImports, className, createTemplateModuleSpecifier(templatePath, signals.members), styleModuleSpecifier);
      } catch (err) {
        state.logError(err, `Failed to inject template into component - ${componentPath}`);
        return fail();
      }

      registerRealFile(componentPath);

      const shim = createShim(new Map([[componentPath, [className]]]), typecheckBody);
      const languageService = getLanguageService(state.compilerOptions, state.projectFileNames);
      const diagnostics = languageService.getSemanticDiagnostics(shim.path);

      /*
        The type-check reads files the dev server does not relate to the component, as the ones holding only
        types: watching them re-runs the transform, and the registry lets the hotUpdate hook invalidate it
      */
      for (const dependency of collectProjectDependencies(languageService.getProgram()!, shim.path, state.compilerOptions)) {
        if (dependency !== componentPath) {
          this.addWatchFile(dependency);
          registerDependency(dependency, componentPath);
        }
      }

      for (let i = 0; i < diagnostics.length; i++) {
        state.logError('', `[TypeChecker] Failed to compile template - ${templatePath}\n${describeDiagnostic(templateSource, diagnostics[i], shim.bodyLineOffset, typecheckBody.mappingTable)}`);
      }

      if (diagnostics.length) {
        return fail();
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
 *
 * @param s - The `MagicString` wrapping the whole component file.
 * @param code - The ORIGINAL (pre-injection) source of the component file.
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
