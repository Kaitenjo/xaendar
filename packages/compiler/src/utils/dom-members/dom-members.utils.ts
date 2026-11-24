import { createSourceFile, getDefaultLibFilePath, InterfaceDeclaration, isIdentifier, isInterfaceDeclaration, isPropertySignature, isStringLiteral, isTypeReferenceNode, ScriptTarget, sys } from 'typescript';
import type { DomLibrary } from '../../types/dom-library.type';

/**
 * The name of the global class every component extends, through `CustomElement`.
 */
export const HTML_ELEMENT = 'HTMLElement';

/**
 * The interface of the DOM library mapping the tag of each native HTML element to its class.
 */
const TAG_NAME_MAP = 'HTMLElementTagNameMap';

/**
 * The DOM library of the TypeScript of the project, read once (see {@link getDomLibrary}).
 */
let domLibrary: DomLibrary | undefined;

/**
 * The names of the members of each native class asked for so far, by name of the class (see
 * {@link getNativeClassMembers}).
 */
const nativeClassMembers = new Map<string, ReadonlySet<string>>();

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
  return getNativeClassMembers(HTML_ELEMENT);
}

/**
 * Gets the names of the members of the class of a native element (`HTMLButtonElement`), its own and the ones of the
 * interfaces it extends, `HTMLElement` included, as the DOM library declares them (see {@link getHTMLElementMembers}):
 * the class a customized built-in element extends through `customElementOf`.
 *
 * @param name - The name of the class.
 * @returns The names, empty when the DOM library cannot be read or does not declare the class.
 */
export function getNativeClassMembers(name: string): ReadonlySet<string> {
  let members = nativeClassMembers.get(name);
  if (!members) {
    const names = new Set<string>();
    collectInterfaceMembers(getDomLibrary().interfaces, name, new Set(), names);
    members = names;
    nativeClassMembers.set(name, members);
  }

  return members;
}

/**
 * Gets the name of the class of a native HTML element, by its tag (`button` → `HTMLButtonElement`), as
 * `HTMLElementTagNameMap` of the DOM library declares it: the class a customized built-in element extending the tag
 * extends through `customElementOf`.
 *
 * @param tagName - The tag of the native element.
 * @returns The name of the class, `undefined` for a tag the library does not declare, or when it cannot be read.
 */
export function getNativeClassOfTag(tagName: string): string | undefined {
  return getDomLibrary().tagClasses.get(tagName);
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
  collectInterfaceMembers(readDomLibrary(fileName).interfaces, name, new Set(), names);
  return names;
}

/**
 * Reads the DOM library of the TypeScript of the project, once per process.
 *
 * N.B. Read once per process, and only when asked: parsing the DOM library takes a while. Do not read it for each
 * component or each class.
 *
 * @returns The library, empty when it cannot be read.
 */
function getDomLibrary(): DomLibrary {
  domLibrary ??= readDomLibrary(`${getDefaultLibFilePath({}).replace(/[^\\/]*$/, '')}lib.dom.d.ts`);
  return domLibrary;
}

/**
 * Reads the interfaces of a declaration file, and the classes of the native elements its `HTMLElementTagNameMap`
 * declares.
 *
 * @param fileName - The path of the declaration file.
 * @returns The library, empty when the file cannot be read.
 */
export function readDomLibrary(fileName: string): DomLibrary {
  const interfaces = new Map<string, InterfaceDeclaration[]>();
  const tagClasses = new Map<string, string>();
  const text = sys.readFile(fileName);
  if (!text) {
    return { interfaces, tagClasses };
  }

  const { statements } = createSourceFile(fileName, text, ScriptTarget.Latest, false);
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (isInterfaceDeclaration(statement)) {
      const declarations = interfaces.get(statement.name.text);
      declarations ? declarations.push(statement) : interfaces.set(statement.name.text, [statement]);
    }
  }

  const tagNameMaps = interfaces.get(TAG_NAME_MAP);
  if (tagNameMaps?.length) {
    for (let i = 0; i < tagNameMaps.length; i++) {
      collectTagClasses(tagNameMaps[i], tagClasses);
    }
  }

  return { interfaces, tagClasses };
}

/**
 * Collects the class of each tag a declaration of `HTMLElementTagNameMap` declares (`"button": HTMLButtonElement;`).
 *
 * @param declaration - The declaration of the interface.
 * @param tagClasses - The classes collected so far, by tag, filled in place.
 */
function collectTagClasses({ members }: InterfaceDeclaration, tagClasses: Map<string, string>): void {
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (isPropertySignature(member) && isStringLiteral(member.name) && member.type && isTypeReferenceNode(member.type) && isIdentifier(member.type.typeName)) {
      tagClasses.set(member.name.text, member.type.typeName.text);
    }
  }
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
