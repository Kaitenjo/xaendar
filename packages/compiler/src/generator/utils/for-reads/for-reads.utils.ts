import type { ForNode } from '../../../parser/types/nodes/for-node.type';
import { FOR_IMPLICIT_VARIABLES } from '../../../parser/utils/for-variables/for-variables.utils';
import { collectReads } from '../../../utils/expression-reads/expression-reads.utils';
import { walkTemplate } from '../../../utils/template-walker/template-walker.utils';
import type { ForVariable } from '../../types/for-variable.type';

/**
 * The names a text of the template holding code can read, e.g. the condition of a `@case` or the handler of an event.
 */
const IDENTIFIER_RE = /[A-Za-z_$][\w$]*/g;

/**
 * Lists the variables of a `@for` its body reads, the ones the runtime creates for each item. A variable counts as read
 * when its name, the alias the template gives it if any, is read anywhere in the body: in the expressions of the
 * interpolations, the bindings, the events, the directives, the blocks, the `@let`, the `@render`, the templates declared
 * in the body and the nested `@for` blocks, their track expressions included, and in the texts the generated code
 * resolves or writes as is: the handlers of the events (`item.set`), the templates the `@render` blocks call and
 * the conditions of the `@case`.
 *
 * The analysis is wider than needed, never narrower: a name the body declares again (a nested `@for`, a `@let`, the
 * parameter of a template) counts as a read of the variable too, since creating a variable the body does not read only
 * wastes memory, while missing one breaks the body.
 *
 * @example
 * // @for (row of rows(); track row.id; i = $index) { <td (click)="pick(i)">{ row.name }</td> }
 * getReadForVariables(node); // ['item', '$index']
 *
 * @param node - The `@for` block.
 * @returns The variables its body reads, the item first, then the implicit variables in the order of
 *   `FOR_IMPLICIT_VARIABLES`: the item only when the `@for` declares one.
 */
export function getReadForVariables(node: ForNode): ForVariable[] {
  const names = new Set<string>();
  walkTemplate(node.children, [], {
    expression: expression => {
      const reads = collectReads(expression);
      for (let i = 0; i < reads.length; i++) {
        names.add(reads[i].text);
      }
    },
    event: ({ handler }) => addWrittenNames(handler, names),
    render: ({ callee }) => names.add(callee),
    switchCase: ({ condition }) => {
      if (condition?.length) {
        for (let i = 0; i < condition.length; i++) {
          addWrittenNames(condition[i], names);
        }
      }
    }
  });

  const read = new Array<ForVariable>();
  if (node.itemAlias && names.has(node.itemAlias)) {
    read.push('item');
  }

  for (let i = 0; i < FOR_IMPLICIT_VARIABLES.length; i++) {
    const implicit = FOR_IMPLICIT_VARIABLES[i];
    if (names.has(node.implicitAliases.get(implicit) ?? implicit)) {
      read.push(implicit);
    }
  }

  return read;
}

/**
 * Writes the variables of a `@for` its body reads as the object literal of the `IterationVariables` of the runtime:
 * the variables, and the names they are declared with in the body (the alias of the item, the alias of an implicit
 * variable, or its own name), at the same index. Both generators declare it once per template, as a constant of the
 * module, which every item of the `@for` reads.
 *
 * @example
 * // @for (row of rows(); track row.id; i = $index) { <td>{ i } { row.name }</td> }
 * writeIterationVariables(node, ['item', '$index']); // "{ used: ['item', '$index'], names: ['row', 'i'] }"
 *
 * @param node - The `@for` block.
 * @param read - The variables its body reads (see {@link getReadForVariables}).
 * @returns The object literal.
 */
export function writeIterationVariables(node: ForNode, read: readonly ForVariable[]): string {
  const used = read.map(variable => `'${variable}'`).join(', ');
  const names = read.map(variable => `'${variable === 'item' ? node.itemAlias : node.implicitAliases.get(variable) ?? variable}'`).join(', ');
  return `{ used: [${used}], names: [${names}] }`;
}

/**
 * Adds the names a text of the template holding code can read: every identifier written in it, the members and the
 * words of its literals too, since a wider set only creates a variable the body does not read.
 *
 * @param text - The text, e.g. the handler of an event or the condition of a `@case`.
 * @param names - The names read, filled with the ones of the text.
 */
function addWrittenNames(text: string, names: Set<string>): void {
  for (const [name] of text.matchAll(IDENTIFIER_RE)) {
    names.add(name);
  }
}
