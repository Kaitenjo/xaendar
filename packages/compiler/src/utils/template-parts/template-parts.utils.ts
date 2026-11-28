import { splitClasses } from '@xaendar/internals';
import type { ASTNode } from '../../parser/types/ast.type';
import type { AttributeNode } from '../../parser/types/nodes/attribute-node.type';
import type { ConditionalBindingNode } from '../../parser/types/nodes/conditional-binding-node.type';
import type { PartBindingNode } from '../../parser/types/nodes/part-binding-node.type';
import type { ComponentParts } from '../../types/component-parts.type';
import type { ExportPartsEntry } from '../../types/export-parts-entry.type';
import { walkTemplate } from '../template-walker/template-walker.utils';

/**
 * Matches what a name of `exportparts` cannot hold: whitespace and a colon.
 */
const NOT_A_NAME = /[\s:]/;

/**
 * Reads the parts a template exposes to `::part()` (see `ComponentParts`): the ones of the static `part` of its
 * elements, the ones toggled by `part.name`, the ones a static `exportparts` forwards, by the name it gives them, the
 * branches of the conditional bindings included. A `part` or an `exportparts` computed by an expression, or a `@render`
 * of a template the template does not declare, which the code using the component gives, makes the parts open.
 *
 * @param ast - The top-level nodes of the template.
 * @returns The parts.
 */
export function collectTemplateParts(ast: readonly ASTNode[]): ComponentParts {
  const names = new Array<string>();
  const declared = new Set<string>();
  const rendered = new Array<string>();
  let open = false;
  const add = (name: string) => {
    names.includes(name) || names.push(name);
  };
  const read = (attributes: readonly AttributeNode[], partBindings: readonly PartBindingNode[], conditionalBindings: readonly ConditionalBindingNode[]) => {
    for (let i = 0; i < attributes.length; i++) {
      const { name, value } = attributes[i];
      if (name !== 'part' && name !== 'exportparts') {
        continue;
      }

      if (typeof value !== 'string') {
        open = true;
      } else if (name === 'part') {
        splitClasses(value)?.forEach(add);
      } else {
        parseExportParts(value, 0).forEach(({ outer }) => add(outer));
      }
    }

    for (let i = 0; i < partBindings.length; i++) {
      add(partBindings[i].partName);
    }

    for (let i = 0; i < conditionalBindings.length; i++) {
      const { branches } = conditionalBindings[i];
      for (let j = 0; j < branches.length; j++) {
        read(branches[j].attributes, branches[j].partBindings, branches[j].conditionalBindings);
      }
    }
  };

  walkTemplate(ast, [], {
    element: node => read(node.attributes, node.partBindings, node.conditionalBindings),
    template: node => declared.add(node.declaration.name),
    render: node => rendered.push(node.callee)
  });

  if (rendered.some(callee => !declared.has(callee))) {
    open = true;
  }

  return open ? { names, open } : { names };
}

/**
 * Reads the entries of the value of an `exportparts`: the parts it forwards, separated by commas, each one a name, or
 * the name of the part followed by a colon and the name it is forwarded by (`label, icon: button-icon`). An entry
 * without a name, or with more than one name on a side of its colon, is left out, as the browser leaves it.
 *
 * @param text - The value, as written.
 * @param offset - The offset of the value in the template, which the spans start from.
 * @returns The entries, in order.
 */
export function parseExportParts(text: string, offset: number): ExportPartsEntry[] {
  const entries = new Array<ExportPartsEntry>();
  let start = 0;
  while (start <= text.length) {
    let end = text.indexOf(',', start);
    if (end < 0) {
      end = text.length;
    }

    const entry = readEntry(text, start, end, offset);
    if (entry) {
      entries.push(entry);
    }

    start = end + 1;
  }

  return entries;
}

/**
 * Reads an entry of an `exportparts` (see {@link parseExportParts}).
 *
 * @param text - The value of the attribute.
 * @param start - The offset of the entry in the value.
 * @param end - The offset of its end, its comma or the end of the value.
 * @param offset - The offset of the value in the template.
 * @returns The entry, `undefined` when it names no part.
 */
function readEntry(text: string, start: number, end: number, offset: number): ExportPartsEntry | undefined {
  const colon = text.indexOf(':', start);
  const innerEnd = colon >= 0 && colon < end ? colon : end;
  const inner = readName(text, start, innerEnd);
  if (!inner) {
    return undefined;
  }

  const outer = innerEnd === end ? inner : readName(text, innerEnd + 1, end);
  if (!outer) {
    return undefined;
  }

  return { inner: inner.name, outer: outer.name, innerSpan: { start: offset + inner.start, end: offset + inner.start + inner.name.length } };
}

/**
 * Reads the name a piece of an entry of an `exportparts` holds, between whitespace.
 *
 * @param text - The value of the attribute.
 * @param start - The offset of the piece.
 * @param end - The offset of its end.
 * @returns The name and its offset in the value, `undefined` when the piece holds none, or more than one.
 */
function readName(text: string, start: number, end: number): { name: string, start: number } | undefined {
  const piece = text.slice(start, end);
  const name = piece.trim();
  if (!name || NOT_A_NAME.test(name)) {
    return undefined;
  }

  return { name, start: start + piece.indexOf(name) };
}
