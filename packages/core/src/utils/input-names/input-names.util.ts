import { INTERNAL_ALIAS_TO_ATTRIBUTE } from '../../costants';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';

/**
 * Translates the name code outside the templates binds an input of a component or of a directive with, its alias when it
 * declares one, into the name of its property, which the runtime sets it by: `createComponent` and `renderToString` do it
 * once, when they receive the inputs. A name the class does not declare as an input, such as an input a host directive
 * exposes, stays as it is.
 *
 * @param klass - The class of the component or of the directive.
 * @param name - The name the input is bound with.
 * @returns The name of the property of the input.
 * @throws When the name is the one of the property of an input declaring an alias, which is bound by its alias.
 */
export function _toPropertyName(klass: { name: string }, name: string): string {
  const aliasToAttribute = getWebComponentMetadata(klass)?.[INTERNAL_ALIAS_TO_ATTRIBUTE];
  const property = aliasToAttribute?.[name];
  if (property) {
    return property;
  }

  // The names of the properties of the inputs without alias are among the names the inputs are bound with
  if (aliasToAttribute && Object.values(aliasToAttribute).includes(name)) {
    throw new Error(`"${name}" is the property of an input of ${klass.name} declaring an alias: bind it by its alias`);
  }

  return name;
}
