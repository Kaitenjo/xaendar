import type { Line, LineMapping } from '../../types/generated-line.type';
import { plain } from '../line-builder/line-builder.utils';

/**
 * An `import()` type, e.g. `import('/src/list.xd.component')`, whose module is the first group.
 */
const IMPORT_TYPE = /import\('([^']+)'\)/g;

/**
 * The prefix of the namespaces the modules referenced by the `import()` types are imported as.
 */
const MODULE_ALIAS = '__module';

/**
 * Replaces the `import()` types of the type-check lines (the types of the properties and events of the components and
 * directives are written through them, see `getAccessorOwnerType`) with namespaces imported once, in lines written
 * before the others: `import('/src/list.xd.component').List` becomes `__module0.List`, after
 * `import type * as __module0 from '/src/list.xd.component';`.
 *
 * The mappings of the lines are moved with the text they map: the columns following a replaced `import()` type are
 * shifted by the difference of its length, and a mapping spanning it is shortened or lengthened by it.
 *
 * @param lines - The type-check lines.
 * @returns The lines importing the modules, followed by the type-check lines referencing them, `lines` when they
 *   reference no module.
 */
export function hoistImportTypes(lines: Line[]): Line[] {
  const aliases = new Map<string, string>();
  const hoisted = lines.map(currentLine => hoistLine(currentLine, aliases));
  if (!aliases.size) {
    return lines;
  }

  const imports = new Array<Line>();
  for (const [modulePath, alias] of aliases) {
    imports.push(plain(`import type * as ${alias} from '${modulePath}';`));
  }

  return imports.concat(hoisted);
}

/**
 * Replaces the `import()` types of a line with the namespaces their modules are imported as.
 *
 * @param currentLine - The line.
 * @param aliases - The namespace of each module, filled with the modules met for the first time.
 * @returns The line referencing the namespaces, with its mappings moved accordingly, `currentLine` when it holds no `import()` type.
 */
function hoistLine(currentLine: Line, aliases: Map<string, string>): Line {
  const shifts = new Array<{ end: number, delta: number }>();
  const text = currentLine.text.replace(IMPORT_TYPE, (match: string, modulePath: string, offset: number) => {
    let alias = aliases.get(modulePath);
    if (!alias) {
      alias = `${MODULE_ALIAS}${aliases.size}`;
      aliases.set(modulePath, alias);
    }

    shifts.push({ end: offset + match.length, delta: alias.length - match.length });
    return alias;
  });

  if (!shifts.length) {
    return currentLine;
  }

  const shift = (column: number): number => shifts.reduce((shifted, { end, delta }) => (end <= column ? shifted + delta : shifted), column);
  const hoisted: Line = { text };
  if (currentLine.mappings) {
    hoisted.mappings = currentLine.mappings.map(({ columnStart, columnEnd, original }): LineMapping => ({ columnStart: shift(columnStart), columnEnd: shift(columnEnd), original }));
  }

  return hoisted;
}
