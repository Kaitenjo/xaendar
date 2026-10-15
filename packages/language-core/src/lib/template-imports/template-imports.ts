import { type ComponentOrDirectiveMetadata, type ImportInsertion, organizeImports, type Span, toImportKey } from '@xaendar/compiler';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { walkTemplate } from '../utils/template-walker/template-walker.utils';

/**
 * A symbol an `@import` statement of a template imports and the template never uses.
 */
export type UnusedImport = {
  /**
   * The span of the specifier in the template: `Name`, or `Name as Alias`.
   */
  readonly span: Span;
  /**
   * The name the symbol is known by in the template.
   */
  readonly name: string;
  /**
   * The key of the specifier, to remove it (see {@link removeTemplateImport}).
   */
  readonly key: string;
};

/**
 * Finds the components and directives a template imports and never uses: no element of the template is the component,
 * no directive or structural directive is the directive.
 *
 * @param analysis - The analysis of the template.
 * @returns The unused imports, in the order they are written in, `undefined` if the template uses all of them.
 */
export function findUnusedImports({ ast, imports, metadatas }: Pick<TemplateAnalysis, 'ast' | 'imports' | 'metadatas'>): UnusedImport[] | undefined {
  const used = new Set<ComponentOrDirectiveMetadata>();
  walkTemplate(ast, metadatas, {
    element: (_node, component) => {
      if (component) {
        used.add(component);
      }
    },
    directive: (_node, directive) => {
      if (directive) {
        used.add(directive);
      }
    }
  });

  let unused: UnusedImport[] | undefined;
  for (let i = 0; i < imports.length; i++) {
    const { node, specifier, metadata } = imports[i];
    if (!used.has(metadata)) {
      unused ??= new Array<UnusedImport>();
      unused.push({
        span: { start: Math.min(specifier.importedSpan.start, specifier.localSpan.start), end: Math.max(specifier.importedSpan.end, specifier.localSpan.end) },
        name: specifier.local,
        key: toImportKey(node.path, specifier.imported === specifier.local ? specifier.imported : `${specifier.imported} as ${specifier.local}`)
      });
    }
  }

  return unused;
}

/**
 * Computes how to remove an unused import from a template, together with the statement it leaves empty.
 *
 * @param source - The current source of the template.
 * @param unused - The unused import.
 * @returns The span and the text to write there, `undefined` if the template doesn't import it.
 */
export function removeTemplateImport(source: string, { key }: UnusedImport): ImportInsertion | undefined {
  return organizeImports(source, { unused: new Set([key]) });
}

/**
 * Computes how to organize the imports of a template: the unused ones are removed, with the statements left empty, the
 * statements importing from the same module are merged, and the statements and their specifiers are sorted.
 *
 * Nothing is removed when the analysis is not the one of the current source (e.g. while the template cannot be compiled),
 * since what the template uses is not known then: the imports are only sorted.
 *
 * @param source - The current source of the template.
 * @param analysis - The last analysis of the template, if any.
 * @returns The span and the text to write there, `undefined` if the imports are already organized.
 */
export function organizeTemplateImports(source: string, analysis: TemplateAnalysis | undefined): ImportInsertion | undefined {
  const unused = analysis?.source === source ? findUnusedImports(analysis) : undefined;
  return organizeImports(source, { unused: unused && new Set(unused.map(({ key }) => key)), sort: true });
}
