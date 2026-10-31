import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile, extractComponentMembers, ComponentMembers, findWebComponentErrors, TypeCheckResult } from '@xaendar/compiler';
import { createShim, getImportConflictDiagnostics, getLanguageService, registerRealFile } from '@xaendar/language-core';
import MagicString from 'magic-string';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createSourceFile, ScriptKind, ScriptTarget } from 'typescript';
import type { HookHandler, Plugin } from 'vite';
import { COMPONENT_TS_FILE_RE } from '../../costants/component-filename-regex';
import { TS_FILE_RE } from '../../costants/ts-file-regex';
import { clearDependenciesForComponent, registerDependency } from '../../registry/dependency-registry/dependency-registry';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { collectProjectDependencies } from '../../utils/project-dependencies/project-dependencies.utils';
import { collectFileDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';
import { claimSelectors, createStyleModuleSpecifier, createTemplateModuleSpecifier, describeDiagnostic, extractImportedComponentPaths, getImportOrExtract, getMetadataOrExtract, injectTemplate } from '../plugin-utils/plugin.utils';

/**
 * Vite plugin `transform` hook: for every Xaendar component declared in a `.xd.component.ts`
 * file, resolves its template and style files, extracts its component members, type-checks the
 * template against the component class, and injects the render function/stylesheet imports and
 * registration into the transpiled output.
 *
 * A component that cannot be compiled is left without its render function: its errors are logged and,
 * in a build, the build fails. So is a component declared in a TypeScript file not following the convention,
 * or whose `@WebComponent` options are not string literals, as they are read from the source code.
 *
 * In the dev server, every TypeScript file of the program is also type-checked as it is served: a file with
 * type errors is not served, and its errors reach the terminal and the overlay of Vite. In a build, the
 * whole program is checked by the `buildEnd` hook.
 *
 * The strategy of the environment (see `XaendarPluginState['strategies']`) gives the registration and whether anything
 * is type-checked: for the rendering on the server, a component registers its modules compiled for the server via
 * `_defineServerRender`, and nothing is type-checked, since the environment of the browser checks the same files.
 *
 * @param state - The shared plugin state (compiler host, project compiler options/file names, logger).
 * @returns The `transform` hook handler.
 */
export function createTransformHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['transform']>> {
  return async function transform(this, code, componentPath) {
    const strategy = state.strategies[this.environment.config.consumer];
    if (!state.isBuild && strategy.typeCheck && TS_FILE_RE.test(componentPath)) {
      const diagnostics = collectFileDiagnostics(getLanguageService(state.compilerOptions, state.projectFileNames), componentPath);
      if (diagnostics.length) {
        this.error(`[TypeChecker] Type check failed\n${formatTypeDiagnostics(diagnostics)}`);
      }
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

    const componentFile = COMPONENT_TS_FILE_RE.test(componentPath);
    // The decorators are read from the source code: the code received here has already been transpiled by Babel
    if (!componentFile && !(TS_FILE_RE.test(componentPath) && code.includes('WebComponent'))) {
      return code;
    }

    const tsSource = createSourceFile(componentPath, await readFile(componentPath, 'utf8'), ScriptTarget.Latest, true);
    const errors = findWebComponentErrors(tsSource, componentFile);
    if (errors?.length) {
      for (let i = 0; i < errors.length; i++) {
        state.logError('', `${errors[i]} - ${componentPath}`);
      }
      return fail();
    }

    if (!componentFile) {
      return code;
    }

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
        state.logError('', `Could not find template at ${templatePath}`);
        return fail();
      }

      this.addWatchFile(templatePath);
      // ! is a safe assertion because we check if the fileExists before reading it
      const templateSource = state.host.readFile(templatePath)!;

      const importedPaths = extractImportedComponentPaths(templateSource, dirname(templatePath), state.compilerOptions);
      for (let j = 0; j < importedPaths.length; j++) {
        const importedPath = importedPaths[j];
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

      let componentMembers: ComponentMembers;
      let typecheckBody: TypeCheckResult | undefined;

      try {
        componentMembers = extractComponentMembers(tsSource, metadata.typescriptNodes.klass, state.compilerOptions);
        /*
          Only the type-check is performed here, as it depends on the component class.
          The render function is compiled once per template in its own module (see the load hook).
        */
        if (strategy.typeCheck) {
          typecheckBody = await compile(templateSource, {
            baseDir: dirname(templatePath),
            shadowingMembers: componentMembers.shadowingMembers,
            reactiveMembers: componentMembers.reactiveMembers,
            customElements: state.customElements,
            cache: {
              getOrInsert: (classNameOrSelector, path) => getMetadataOrExtract(classNameOrSelector, path, state.compilerOptions),
              getImport: (imported, local, baseDir, path) => getImportOrExtract(imported, local, baseDir, path, state.compilerOptions),
              set: registerMetadata
            }
          });
        }
      } catch (err) {
        state.logError(err, `Failed to compile template - ${templatePath}`);
        return fail();
      }

      /*
        The component members also depend on the classes the component inherits from: watching their files
        re-runs the transform in build watch mode, while the registry lets the hotUpdate hook fully
        invalidate the component in dev mode, where a statically imported file is only soft-invalidated.
      */
      for (let j = 0; j < componentMembers.dependencies.length; j++) {
        const dependency = componentMembers.dependencies[j];
        this.addWatchFile(dependency);
        registerDependency(dependency, componentPath);
      }

      try {
        injectTemplate(magicString, jsSourceFile, moduleImports, className, createTemplateModuleSpecifier(templatePath, componentMembers.reactiveMembers, componentMembers.shadowingMembers), strategy.registration, styleModuleSpecifier);
      } catch (err) {
        state.logError(err, `Failed to inject template into component - ${componentPath}`);
        return fail();
      }

      // The environment of the server leaves the type-check to the one of the browser, which checks the same component
      if (!typecheckBody) {
        continue;
      }

      registerRealFile(componentPath);

      const shim = createShim(new Map([[componentPath, [className]]]), typecheckBody);
      const languageService = getLanguageService(state.compilerOptions, state.projectFileNames);
      const diagnostics = languageService.getSemanticDiagnostics(shim.path).slice();
      // A symbol imported under the name of a member of the component makes the expressions reading it ambiguous
      const conflicts = getImportConflictDiagnostics(languageService, shim.path, shim.bodyLineOffset);
      if (conflicts?.length) {
        diagnostics.push(...conflicts);
      }

      /*
        The type-check reads files the dev server does not relate to the component, as the ones holding only
        types: watching them re-runs the transform, and the registry lets the hotUpdate hook invalidate it
      */
      const projectDependencies = collectProjectDependencies(languageService.getProgram()!, shim.path, state.compilerOptions);
      for (let j = 0; j < projectDependencies.length; j++) {
        const dependency = projectDependencies[j];
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
