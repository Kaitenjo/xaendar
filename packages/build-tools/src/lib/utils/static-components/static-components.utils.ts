import { ASTNodeType, type ComponentMetadata, extractComponentMembers, extractComponentsMetadataFromSourceFile, findComponentLogic, findModuleLogic, type ImportNode, parseTemplate, resolveTemplateImports } from '@xaendar/compiler';
import { getLanguageService, getTemplateUsage, NOT_IMPORTABLE, type TemplateUsage } from '@xaendar/language-core';
import { dirname } from 'node:path';
import { createSourceFile, type Program, ScriptTarget, type SourceFile } from 'typescript';
import { COMPONENT_TS_FILE_RE } from '../../costants/component-filename-regex';
import { getImportOrExtract } from '../../plugin/plugin-utils/plugin.utils';
import type { ComponentNode } from '../../types/component-node.type';
import type { StaticComponents } from '../../types/static-components.type';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { findCodeImports } from '../code-imports/code-imports.utils';
import { resolvePosixPath } from '../path/path.utils';
import { isSerializableInput } from '../serializable-input/serializable-input.utils';

/**
 * Matches the extension of a TypeScript module.
 */
const TS_EXTENSION = /\.[cm]?tsx?$/;

/**
 * Finds the static components of a project rendering on the server: the ones the browser does not need, which stay the
 * HTML of the server and leave the bundle of the browser.
 *
 * A component is interactive when it has logic of its own (see `findComponentLogic`, `findModuleLogic`,
 * `getTemplateUsage`), when the code of the project imports something from its module, and because of the templates
 * rendering it: an interactive component binding it to a signal, or rendering it in a block the browser renders again,
 * makes it interactive, and a static one passing it an input that cannot be written into the HTML has to hydrate too. A
 * component the browser may create, in such a block or because the code imports its module, creates every component
 * its template renders, at any depth.
 *
 * The components sharing a module or a template stay on the same side, since they are loaded and compiled as one.
 *
 * @param state - The state of the plugin.
 * @returns What the analysis found.
 */
export async function findStaticComponents(state: XaendarPluginState): Promise<StaticComponents> {
  const { compilerOptions, host, projectFileNames, root, ssr } = state;
  const entry = resolvePosixPath(root, ssr!.entry).replace(TS_EXTENSION, '');
  const browserFiles = projectFileNames.filter(fileName => !NOT_IMPORTABLE.test(fileName) && fileName.replace(TS_EXTENSION, '') !== entry);
  const imported = findCodeImports(browserFiles, path => host.readFile(path), compilerOptions);

  const nodes = new Map<string, ComponentNode>();
  const componentFiles = projectFileNames.filter(fileName => COMPONENT_TS_FILE_RE.test(fileName));
  for (let i = 0; i < componentFiles.length; i++) {
    await readComponents(componentFiles[i], imported.has(componentFiles[i]), state, nodes);
  }

  propagate(nodes, () => getLanguageService(compilerOptions, projectFileNames).getProgram()!);
  return toStaticComponents(nodes);
}

/**
 * Describes the outcome of the analysis, for the terminal.
 *
 * @param staticComponents - The outcome.
 * @param detailed - Whether to tell what keeps each interactive component in the bundle.
 * @returns The text.
 */
export function describeStaticComponents({ statics, interactive }: StaticComponents, detailed: boolean): string {
  const lines = [`Xaendar: ${statics.length} of ${statics.length + interactive.size} components are static, left out of the bundle of the browser`];
  if (statics.length) {
    lines.push(`  ${statics.join(', ')}`);
  }

  if (detailed) {
    for (const [selector, logic] of interactive) {
      lines.push(`  ${selector}: ${logic}`);
    }
  }

  return lines.join('\n');
}

/**
 * Reads the components a module declares into the nodes. A module that cannot be read declares none: the build reports
 * its error, and the components rendering it stay interactive.
 *
 * @param file - The path of the module.
 * @param importedByCode - Whether the code of the project imports something from it: that code may create its
 *   components, so they and everything they render stay in the bundle.
 * @param state - The state of the plugin.
 * @param nodes - The nodes, by tag name.
 */
async function readComponents(file: string, importedByCode: boolean, state: XaendarPluginState, nodes: Map<string, ComponentNode>): Promise<void> {
  const { compilerOptions, host } = state;
  const sourceFile = createSourceFile(file, host.readFile(file) ?? '', ScriptTarget.Latest, true);
  let metadatas: Map<string, ComponentMetadata> | undefined;
  try {
    metadatas = await extractComponentsMetadataFromSourceFile(sourceFile, compilerOptions);
  } catch {
    return;
  }

  if (metadatas?.size) {
    const moduleLogic = importedByCode ? 'its module is imported by code' : findModuleLogic(sourceFile, compilerOptions);
    for (const metadata of metadatas.values()) {
      const templatePath = resolvePosixPath(dirname(file), metadata.templateUrl);
      const { logic, components } = await readTemplate(templatePath, metadata, sourceFile, state);
      nodes.set(metadata.selector, {
        metadata,
        file,
        templatePath,
        usages: components,
        logic: moduleLogic ?? findComponentLogic(metadata.typescriptNodes, compilerOptions) ?? logic,
        created: importedByCode
      });
    }
  }
}

/**
 * Reads what the template of a component needs from the browser.
 *
 * @param templatePath - The path of the template.
 * @param metadata - The metadata of the component.
 * @param sourceFile - The file of the component.
 * @param state - The state of the plugin.
 * @returns What it needs: the build reports the errors of a template that cannot be read, which is interactive.
 */
async function readTemplate(templatePath: string, metadata: ComponentMetadata, sourceFile: SourceFile, { compilerOptions, host }: XaendarPluginState): Promise<TemplateUsage> {
  const source = host.readFile(templatePath);
  if (source === undefined) {
    return { logic: 'its template cannot be read', components: [] };
  }

  try {
    const nodes = parseTemplate(source);
    const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
    const { metadatas, symbols } = await resolveTemplateImports(importNodes, dirname(templatePath), {
      getImport: (imported, local, baseDir, path) => getImportOrExtract(imported, local, baseDir, path, compilerOptions)
    });
    return getTemplateUsage(nodes, metadatas, symbols, extractComponentMembers(sourceFile, metadata.typescriptNodes.klass, compilerOptions));
  } catch {
    return { logic: 'its template cannot be read', components: [] };
  }
}

/**
 * Spreads what makes a component interactive through the templates, until nothing changes.
 *
 * @param nodes - The nodes, by tag name.
 * @param getProgram - Gets the program of the project, the first time a type has to be read.
 */
function propagate(nodes: ReadonlyMap<string, ComponentNode>, getProgram: () => Program): void {
  const peers = groupPeers(nodes);
  let changed = true;
  const mark = (node: ComponentNode, logic: string): void => {
    if (!node.logic) {
      node.logic = logic;
      changed = true;
    }
  };

  const create = (child: ComponentNode, selector: string): void => {
    if (!child.created) {
      child.created = true;
      changed = true;
    }

    mark(child, `<${selector}> may create it in the browser`);
  };

  const markPeers = (selector: string, { logic, file, templatePath }: ComponentNode): void => {
    if (logic) {
      const group = peers.get(file)!.concat(peers.get(templatePath)!);
      for (let i = 0; i < group.length; i++) {
        mark(group[i], `shares its module or its template with <${selector}>`);
      }
    }
  };

  while (changed) {
    changed = false;
    for (const [selector, node] of nodes) {
      for (let i = 0; i < node.usages.length; i++) {
        const usage = node.usages[i];
        const child = nodes.get(usage.component.selector);
        if (!usage.placeholder) {
          if (!child) {
            mark(node, `renders <${usage.component.selector}>, which is outside of the project`);
          } else if (!node.logic) {
            const input = child.logic ? usage.expressionInputs.find(name => !isSerializableInput(getProgram(), child.metadata, name)) : undefined;
            if (input) {
              mark(node, `passes to <${usage.component.selector}> the input ${input}, which cannot be written into the HTML`);
            }
          } else if (usage.dynamic || node.created) {
            create(child, selector);
          } else if (usage.reactiveInputs) {
            mark(child, `<${selector}> binds a signal to one of its inputs`);
          }
        }
      }

      markPeers(selector, node);
    }
  }
}

/**
 * Groups the components by what they share.
 *
 * @param nodes - The nodes.
 * @returns The components declared by each module and using each template, by their path.
 */
function groupPeers(nodes: ReadonlyMap<string, ComponentNode>): Map<string, ComponentNode[]> {
  const peers = new Map<string, ComponentNode[]>();
  for (const node of nodes.values()) {
    peers.getOrInsertComputed(node.file, () => new Array<ComponentNode>()).push(node);
    peers.getOrInsertComputed(node.templatePath, () => new Array<ComponentNode>()).push(node);
  }

  return peers;
}

/**
 * Builds the outcome of the analysis.
 *
 * @param nodes - The nodes, once nothing spreads anymore.
 * @returns The outcome.
 */
function toStaticComponents(nodes: ReadonlyMap<string, ComponentNode>): StaticComponents {
  const modules = new Map<string, string[]>();
  const islands = new Map<string, Set<string>>();
  const statics = new Array<string>();
  const interactive = new Map<string, string>();

  for (const [selector, node] of nodes) {
    if (node.logic) {
      interactive.set(selector, node.logic);
      continue;
    }

    statics.push(selector);
    const imports = modules.getOrInsertComputed(node.file, () => new Array<string>());
    for (let i = 0; i < node.usages.length; i++) {
      const { component } = node.usages[i];
      const child = nodes.get(component.selector)!;
      if (!imports.includes(child.file)) {
        imports.push(child.file);
      }

      if (child.logic) {
        islands.getOrInsertComputed(node.templatePath, () => new Set()).add(component.selector);
      }
    }
  }

  return { modules, islands, statics, interactive };
}
