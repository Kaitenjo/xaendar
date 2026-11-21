import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import type { CompilerOptions, LanguageService, TextChange } from 'typescript';

/*
  Organizes the imports of the TypeScript files and of the Xaendar templates as Alt+Shift+O does in VS Code: the unused
  ones are removed, the ones importing from the same module merged, then they are sorted. TypeScript files go through
  `organizeImports` of the TypeScript language service, templates through `organizeTemplateImports` of
  `@xaendar/language-core`, the code action of the Xaendar language server.

  Usage: npm run organize-imports [-- --all] [-- --stage] [-- --hook]
    --all    every file of the repository git knows (tracked, or untracked and not ignored), not only the changed ones
    --stage  adds again to the index the files organized that were staged, so that the next commit holds them organized
    --hook   reports the files organized as the JSON a hook of Claude Code prints, and nothing when there are none
*/

/**
 * The root of the repository.
 */
const REPOSITORY_ROOT = resolve(import.meta.dirname, '../..');

/**
 * The suffix of the templates of the components.
 */
const TEMPLATE_SUFFIX = '.xd.component.html';

/**
 * The suffix of the files of the components, beside their template.
 */
const COMPONENT_SUFFIX = '.xd.component.ts';

/**
 * Runs git in the repository.
 *
 * @param args - The arguments of git.
 * @returns The lines it printed, without the empty ones.
 */
function git(args: readonly string[]): string[] {
  return execFileSync('git', args, { cwd: REPOSITORY_ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
}

/**
 * Tells whether a file is one whose imports are organized: a TypeScript file or a template.
 *
 * @param path - The path of the file.
 * @returns `true` for a `.ts` file or a template.
 */
function isOrganizable(path: string): boolean {
  return path.endsWith('.ts') || path.endsWith(TEMPLATE_SUFFIX);
}

/**
 * Lists the files to organize: the ones changed since the last commit, staged or not, and the new ones git does not
 * ignore, or every file of the repository.
 *
 * @param all - Whether to list every file instead of the changed ones.
 * @returns The absolute paths of the files that exist.
 */
function listFiles(all: boolean): string[] {
  const paths = new Set(all ? git(['ls-files']) : git(['diff', '--name-only', 'HEAD']));
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  for (let i = 0; i < untracked.length; i++) {
    paths.add(untracked[i]);
  }

  const files = new Array<string>();
  for (const path of paths) {
    const file = resolve(REPOSITORY_ROOT, path);
    if (isOrganizable(path) && existsSync(file)) {
      files.push(file);
    }
  }

  return files;
}

/**
 * Applies text changes to a text.
 *
 * @param text - The text.
 * @param changes - The changes, whose spans refer to the text as it is.
 * @returns The text changed.
 */
function applyChanges(text: string, changes: readonly TextChange[]): string {
  const sorted = [...changes].sort((first, second) => second.span.start - first.span.start);
  let result = text;
  for (let i = 0; i < sorted.length; i++) {
    const { span, newText } = sorted[i];
    result = `${result.slice(0, span.start)}${newText}${result.slice(span.start + span.length)}`;
  }

  return result;
}

/**
 * Creates the TypeScript language service of a project, holding the files to organize as its roots: organizing the
 * imports of a file needs only the file and the modules it imports, resolved with the options of its `tsconfig.json`.
 *
 * @param typescript - The TypeScript module.
 * @param configPath - The path of the `tsconfig.json` of the project, `undefined` for files outside of any project.
 * @param fileNames - The files to organize.
 * @returns The language service.
 */
function createLanguageService(typescript: typeof import('typescript'), configPath: string | undefined, fileNames: readonly string[]): LanguageService {
  const { createDocumentRegistry, getDefaultLibFilePath, parseJsonConfigFileContent, readConfigFile, ScriptSnapshot, sys } = typescript;
  let options: CompilerOptions = {};
  if (configPath) {
    const { config } = readConfigFile(configPath, sys.readFile);
    options = parseJsonConfigFileContent(config ?? {}, sys, dirname(configPath)).options;
  }

  return typescript.createLanguageService({
    getCompilationSettings: () => options,
    getScriptFileNames: () => fileNames.slice(),
    getScriptVersion: () => '0',
    getScriptSnapshot: fileName => {
      const text = sys.readFile(fileName);
      return text === undefined ? undefined : ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => configPath ? dirname(configPath) : REPOSITORY_ROOT,
    getDefaultLibFileName: getDefaultLibFilePath,
    fileExists: sys.fileExists,
    readFile: sys.readFile,
    readDirectory: sys.readDirectory,
    directoryExists: sys.directoryExists,
    getDirectories: sys.getDirectories
  }, createDocumentRegistry());
}

/**
 * Organizes the imports of TypeScript files, project by project, as `organizeImports` of the language service does
 * with the mode of Alt+Shift+O (removing the unused ones, merging and sorting).
 *
 * @param fileNames - The files, with forward slashes.
 * @returns The files whose imports changed.
 */
async function organizeScripts(fileNames: readonly string[]): Promise<string[]> {
  const typescript = (await import('typescript')).default;
  const { findConfigFile, getDefaultFormatCodeSettings, OrganizeImportsMode, sys } = typescript;
  const projects = new Map<string | undefined, string[]>();
  for (let i = 0; i < fileNames.length; i++) {
    projects.getOrInsert(findConfigFile(dirname(fileNames[i]), sys.fileExists, 'tsconfig.json'), []).push(fileNames[i]);
  }

  const organized = new Array<string>();
  for (const [configPath, files] of projects) {
    const languageService = createLanguageService(typescript, configPath, files);
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      try {
        const text = readFileSync(fileName, 'utf8');
        const formatOptions = Object.assign(getDefaultFormatCodeSettings(text.includes('\r\n') ? '\r\n' : '\n'), { insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true });
        const fileChanges = languageService.organizeImports({ type: 'file', fileName, mode: OrganizeImportsMode.All }, formatOptions, {});
        const changes = fileChanges.flatMap(({ textChanges }) => textChanges);
        const result = changes.length ? applyChanges(text, changes) : text;
        if (result !== text) {
          writeFileSync(fileName, result);
          organized.push(fileName);
        }
      } catch (error) {
        console.error(`Cannot organize the imports of ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    languageService.dispose();
  }

  return organized;
}

/**
 * Analyzes a template with the component beside it, as the language server does, so that its unused imports are known.
 *
 * @param templatePath - The path of the template.
 * @param source - The text of the template.
 * @returns The analysis of the template, `undefined` when it has no component beside it or does not compile: its imports
 *   are then merged and sorted, but none is removed.
 */
async function analyze(templatePath: string, source: string): Promise<import('@xaendar/language-core').TemplateAnalysis | undefined> {
  const componentPath = `${templatePath.slice(0, -TEMPLATE_SUFFIX.length)}${COMPONENT_SUFFIX}`;
  if (!existsSync(componentPath)) {
    return undefined;
  }

  const [{ extractComponentsMetadataFromSourceFile }, { analyzeTemplate, normalizeFileName }, { createSourceFile, ScriptTarget }] = await Promise.all([import('@xaendar/compiler'), import('@xaendar/language-core'), import('typescript')]);
  const metadatas = await extractComponentsMetadataFromSourceFile(createSourceFile(componentPath, readFileSync(componentPath, 'utf8'), ScriptTarget.Latest, true));
  const classNames = new Array<string>();
  if (metadatas?.size) {
    for (const [className, { templateUrl }] of metadatas) {
      if (normalizeFileName(resolve(dirname(componentPath), templateUrl)) === normalizeFileName(templatePath)) {
        classNames.push(className);
      }
    }
  }

  if (!classNames.length) {
    return undefined;
  }

  const { analysis } = await analyzeTemplate(templatePath, source, new Map([[componentPath, classNames]]));
  return analysis?.source === source ? analysis : undefined;
}

/**
 * Organizes the imports of templates as the code action of the Xaendar language server does.
 *
 * @param fileNames - The templates, with forward slashes.
 * @returns The templates whose imports changed.
 */
async function organizeTemplates(fileNames: readonly string[]): Promise<string[]> {
  const { organizeTemplateImports } = await import('@xaendar/language-core');
  const organized = new Array<string>();
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i];
    try {
      const source = readFileSync(fileName, 'utf8');
      const organization = organizeTemplateImports(source, await analyze(fileName, source));
      if (organization) {
        const { span, newText } = organization;
        writeFileSync(fileName, `${source.slice(0, span.start)}${newText}${source.slice(span.end)}`);
        organized.push(fileName);
      }
    } catch (error) {
      console.error(`Cannot organize the imports of ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return organized;
}

/**
 * Organizes the imports of the files asked for, then reports them.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const files = listFiles(args.includes('--all')).map(file => file.replaceAll('\\', '/'));
  if (!files.length) {
    return;
  }

  const staged = args.includes('--stage') ? new Set(git(['diff', '--cached', '--name-only'])) : undefined;
  const organized = (await organizeScripts(files.filter(file => file.endsWith('.ts'))))
    .concat(await organizeTemplates(files.filter(file => file.endsWith(TEMPLATE_SUFFIX))))
    .map(file => relative(REPOSITORY_ROOT, file).replaceAll('\\', '/'));
  if (!organized.length) {
    return;
  }

  const restaged = staged ? organized.filter(file => staged.has(file)) : undefined;
  if (restaged?.length) {
    git(['add', '--', ...restaged]);
  }

  const message = `Organized the imports of ${organized.length} file(s): ${organized.join(', ')}`;
  console.log(args.includes('--hook') ? JSON.stringify({ systemMessage: message }) : message);
}

await main();
