import type { GeneratorContext } from '../../context/context';

/**
 * The widest object or array literal written on one line: a wider one, or one holding a value written on several lines,
 * is written with a member per line.
 */
const INLINE_WIDTH = 100;

/**
 * Writes an object literal from its members (`name: value`), for the constants of the module: on one line when it is
 * short and every value fits on one line, with a member per line otherwise, the lines of a value written on several
 * lines indented with it.
 *
 * @example
 * toObjectLiteral(['tagName: \'td\'', 'children: td0Children']); // "{ tagName: 'td', children: td0Children }"
 *
 * @param members - The members, in order.
 * @returns The code of the object.
 */
export function toObjectLiteral(members: readonly string[]): string {
  return toLiteral('{', '}', members, true);
}

/**
 * Writes an array literal from its items, for the constants of the module, as {@link toObjectLiteral} writes an object.
 *
 * @param items - The items, in order.
 * @returns The code of the array.
 */
export function toArrayLiteral(items: readonly string[]): string {
  return toLiteral('[', ']', items, false);
}

/**
 * Declares the function of the module computing an expression of the template (see `GeneratorContext.declareFunction`):
 * it returns the value of the expression, resolved against the scope it is written in, reading the variables of the
 * template from the context it receives and the members of the component from `this`.
 *
 * @param generatorContext - The generator context of the scope of the expression.
 * @param name - The name of the function: the name of the element or of the block holding the expression, `$` and its
 *   role (see {@link toRoleName}).
 * @param expression - The resolved expression.
 * @param parameters - The parameters of the function. Defaults to the context alone.
 * @returns The name the function is declared with.
 */
export function declareExpression(generatorContext: GeneratorContext, name: string, expression: string, parameters = 'context'): string {
  return generatorContext.declareFunction(name, parameters, [`return ${expression};`]);
}

/**
 * Turns a text into the part of a name of the module telling the role of what it names (`aria-hidden` → `aria_hidden`):
 * the characters an identifier cannot hold become `_`.
 *
 * @param text - The text, e.g. the name of an attribute or of an event.
 * @returns The part of the name.
 */
/**
 * Declares the binding of a variable whose value the runtime computes, a `@let` or the default value of a parameter of
 * a template (see `LetBinding` of the runtime): a constant of the module holding the function of the module computing
 * the value, the slot and the identifier of the variable, and the variables of the template it reads, whose slots the
 * scope declaring the variable reserves (see `GeneratorContext.declareBinding`).
 *
 * @param generatorContext - The scope declaring the variable.
 * @param name - The name of the function computing the value, which the constant is named after (`div0$let_total`).
 * @param expression - The resolved expression of the value.
 * @param slot - The slot of the variable.
 * @param id - The identifier of the variable, unique in its template.
 * @param variables - The identifiers of the variables of the template the expression reads, if any.
 * @returns The name of the constant.
 */
export function declareLetBinding(generatorContext: GeneratorContext, name: string, expression: string, slot: number, id: number, variables: readonly number[] | undefined): string {
  const members = [`value: ${declareExpression(generatorContext, name, expression)}`, `variable: ${slot}`, `id: ${id}`];
  const reads = generatorContext.getReads(variables);
  if (reads) {
    members.push(`reads: ${reads}`);
  }

  // The binding writes its scope: it keeps no target
  return generatorContext.declareBinding(`${name}$binding`, members, '_runLet', false)!;
}

export function toRoleName(text: string): string {
  return text.replace(/[^\w$]/g, '_');
}

/**
 * Writes a literal from its parts between its delimiters, see {@link toObjectLiteral}.
 *
 * @param open - The opening delimiter.
 * @param close - The closing delimiter.
 * @param parts - The members or the items.
 * @param spaced - Whether the literal written on one line has a space inside its delimiters, as an object has.
 * @returns The code of the literal.
 */
function toLiteral(open: string, close: string, parts: readonly string[], spaced: boolean): string {
  if (!parts.length) {
    return `${open}${close}`;
  }

  const inline = spaced ? `${open} ${parts.join(', ')} ${close}` : `${open}${parts.join(', ')}${close}`;
  if (inline.length <= INLINE_WIDTH && !inline.includes('\n')) {
    return inline;
  }

  const lines = new Array<string>(parts.length + 2);
  lines[0] = open;
  for (let i = 0; i < parts.length; i++) {
    lines[i + 1] = `  ${parts[i].replace(/\n/g, '\n  ')}${i < parts.length - 1 ? ',' : ''}`;
  }

  lines[parts.length + 1] = close;
  return lines.join('\n');
}
