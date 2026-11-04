import type { ImportNode } from '../../../parser/types/nodes/import-node.type';
import { assertImportableSymbol, toTypeCheckModuleSpecifier } from '../../../utils/symbol-imports/symbol-imports.utils';
import type { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Line } from '../../types/line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { line, mapped } from '../../utils/line-builder/line-builder.utils';

/**
 * Type-checks an `@import`: each symbol it imports (see `SymbolImport`) gets an import declaration, written before the
 * type-check function, so that the expressions and the type arguments reading it read the export of the module. The
 * components and the directives it imports are checked through their metadata instead, and get none.
 *
 * The names of the declaration are mapped onto the ones of the template, where TypeScript reports an export the
 * module doesn't have, and where the definition and the hover of an imported name are looked up.
 *
 * @example
 * // @import { formatDate, Status as State } from './utils';
 * import { formatDate } from '/src/utils';
 * import { Status as State } from '/src/utils';
 *
 * @param node - The `ImportNode` to type-check.
 * @param _processNode - Unused: an import has no children.
 * @param context - The type-check scope of the template.
 * @returns The import declarations, one per symbol.
 * @throws If a symbol is imported under a name the generated code reserves.
 */
export function typeCheckImport(node: ImportNode, _processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();
  const { specifiers } = node;

  for (let i = 0; i < specifiers.length; i++) {
    const symbol = context.getSymbolImport(specifiers[i]);
    if (symbol) {
      assertImportableSymbol(symbol);
      const { imported, local, importedSpan, localSpan } = symbol;
      const from = ` from '${toTypeCheckModuleSpecifier(symbol)}';`;

      if (imported === '*') {
        lines.push(line('import * as ', mapped(local, localSpan), from));
      } else if (imported === local) {
        lines.push(line('import { ', mapped(imported, importedSpan), ` }${from}`));
      } else {
        lines.push(line('import { ', mapped(imported, importedSpan), ' as ', mapped(local, localSpan), ` }${from}`));
      }
    }
  }

  return lines;
}
