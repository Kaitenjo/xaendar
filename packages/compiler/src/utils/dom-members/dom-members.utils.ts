import { createSourceFile, getDefaultLibFilePath, InterfaceDeclaration, isIdentifier, isInterfaceDeclaration, isStringLiteral, ScriptTarget, sys } from 'typescript';

/**
 * The name of the global class every component extends, through `CustomElement`.
 */
export const HTML_ELEMENT = 'HTMLElement';

/**
 * The names of the members of `HTMLElement`, read once (see {@link getHTMLElementMembers}).
 */
let htmlElementMembers: ReadonlySet<string> | undefined;

/**
 * Gets the names of the members of `HTMLElement`, its own and the ones of the interfaces it extends (`Element`, `Node`,
 * `EventTarget`, `GlobalEventHandlers`…), as the `lib.dom.d.ts` of the TypeScript of the project declares them: the DOM
 * library declares `HTMLElement` as an interface and a variable, not as a class, so that the base classes of a component
 * cannot be followed up to it.
 *
 * N.B. Read once per process, and only when asked: parsing the DOM library takes a while. Do not read it for each
 * component.
 *
 * @returns The names, empty when the DOM library cannot be read.
 */
export function getHTMLElementMembers(): ReadonlySet<string> {
  htmlElementMembers ??= readInterfaceMembers(`${getDefaultLibFilePath({}).replace(/[^\\/]*$/, '')}lib.dom.d.ts`, HTML_ELEMENT);
  return htmlElementMembers;
}

/**
 * Reads the names of the members of an interface of a declaration file and of the interfaces it extends, following the
 * declarations of each interface the file merges.
 *
 * @param fileName - The path of the declaration file.
 * @param name - The name of the interface.
 * @returns The names, empty when the file cannot be read.
 */
export function readInterfaceMembers(fileName: string, name: string): ReadonlySet<string> {
  const names = new Set<string>();
  const text = sys.readFile(fileName);
  if (!text) {
    return names;
  }

  const interfaces = new Map<string, InterfaceDeclaration[]>();
  const { statements } = createSourceFile(fileName, text, ScriptTarget.Latest, false);
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (isInterfaceDeclaration(statement)) {
      const declarations = interfaces.get(statement.name.text);
      declarations ? declarations.push(statement) : interfaces.set(statement.name.text, [statement]);
    }
  }

  collectInterfaceMembers(interfaces, name, new Set(), names);
  return names;
}

/**
 * Collects the names of the members of an interface, then of the interfaces it extends.
 *
 * @param interfaces - The declarations of the interfaces of the file, by name.
 * @param name - The name of the interface.
 * @param visited - The interfaces already collected, filled in place.
 * @param names - The names collected so far, filled in place.
 */
function collectInterfaceMembers(interfaces: ReadonlyMap<string, readonly InterfaceDeclaration[]>, name: string, visited: Set<string>, names: Set<string>): void {
  const declarations = interfaces.get(name);
  if (!declarations?.length || visited.has(name)) {
    return;
  }

  visited.add(name);
  for (let i = 0; i < declarations.length; i++) {
    const { members, heritageClauses } = declarations[i];
    for (let j = 0; j < members.length; j++) {
      const memberName = members[j].name;
      if (memberName && (isIdentifier(memberName) || isStringLiteral(memberName))) {
        names.add(memberName.text);
      }
    }

    if (heritageClauses?.length) {
      for (let j = 0; j < heritageClauses.length; j++) {
        const { types } = heritageClauses[j];
        for (let k = 0; k < types.length; k++) {
          const { expression } = types[k];
          if (isIdentifier(expression)) {
            collectInterfaceMembers(interfaces, expression.text, visited, names);
          }
        }
      }
    }
  }
}
