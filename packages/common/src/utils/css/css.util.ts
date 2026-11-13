/**
 * The units a style binding can follow its property with (`[style.width.px]`, `@HostProperty('style.width.px')`): the
 * lengths, the angles, the times, the frequencies, the resolutions and the flex fraction of CSS, and `%`.
 */
export const CSS_UNITS: ReadonlySet<string> = new Set([
  '%',
  'cap', 'ch', 'em', 'ex', 'ic', 'lh', 'rcap', 'rch', 'rem', 'rex', 'ric', 'rlh',
  'vb', 'vh', 'vi', 'vw', 'vmin', 'vmax',
  'dvb', 'dvh', 'dvi', 'dvw', 'dvmin', 'dvmax',
  'lvb', 'lvh', 'lvi', 'lvw', 'lvmin', 'lvmax',
  'svb', 'svh', 'svi', 'svw', 'svmin', 'svmax',
  'cqb', 'cqh', 'cqi', 'cqw', 'cqmin', 'cqmax',
  'cm', 'mm', 'q', 'in', 'pc', 'pt', 'px',
  'deg', 'grad', 'rad', 'turn',
  's', 'ms',
  'hz', 'khz',
  'dpi', 'dpcm', 'dppx', 'x',
  'fr'
]);

/**
 * The priority a style declaration ends with, matched case-insensitively with the spaces before it.
 */
const IMPORTANT_RE = /\s*!\s*important\s*$/i;

/**
 * Converts the name of a style property to the one CSS uses: a property written in camelCase becomes kebab-case
 * (`fontSize` → `font-size`, `WebkitTransform` → `-webkit-transform`), a custom property (`--accent`) stays as written,
 * since its name is case-sensitive.
 *
 * @param name - The name of the property.
 * @returns The name in CSS.
 */
export function toCssPropertyName(name: string): string {
  return name.startsWith('--') ? name : name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Splits the text of a `class` attribute into its classes, separated by ASCII whitespace, each once.
 *
 * @param text - The text of the attribute.
 * @returns The classes, in order, `undefined` when there are none.
 */
export function splitClasses(text: string): string[] | undefined {
  const tokens = text.split(/[\t\n\f\r ]+/);
  let classes: string[] | undefined;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token && !classes?.includes(token)) {
      classes ? classes.push(token) : classes = [token];
    }
  }

  return classes;
}

/**
 * Parses the text of a `style` attribute into its declarations, as a flat list of names and values
 * (`['display', 'flex', 'gap', '4px']`). The declarations are separated by `;` and the name from the value by the first
 * `:`, both outside parentheses and quotes, so that `url(a;b)`, `var(--x, a)` and `"a;b"` stay whole. The name of a
 * property that is not custom is lowercased, as CSS compares them, and a value keeps `!important`, normalized to
 * ` !important`. A declaration without name or value is left out, and a property declared
 * twice keeps its last value, as the browser does.
 *
 * @param text - The text of the attribute.
 * @returns The names and the values, `undefined` when there are none.
 */
export function parseStyleDeclarations(text: string): string[] | undefined {
  let declarations: string[] | undefined;
  let start = 0;
  let colon = -1;
  let depth = 0;
  let quote = '';
  for (let i = 0; i <= text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = '';
      }

      continue;
    }

    switch (char) {
      case '"':
      case '\'':
        quote = char;
        break;

      case '(':
        depth++;
        break;

      case ')':
        depth && depth--;
        break;

      case ':':
        if (!depth && colon === -1) {
          colon = i;
        }
        break;

      case ';':
      case undefined:
        if (!depth || char === undefined) {
          declarations = addDeclaration(declarations, text, start, colon, i);
          start = i + 1;
          colon = -1;
          depth = 0;
        }
        break;
    }
  }

  return declarations;
}

/**
 * Adds a declaration of the text of a `style` attribute to the list, replacing the value of a property already there.
 *
 * @param declarations - The declarations found so far.
 * @param text - The text of the attribute.
 * @param start - The offset the declaration starts at.
 * @param colon - The offset of the `:` separating its name from its value, `-1` when it has none.
 * @param end - The offset the declaration ends at.
 * @returns The declarations.
 */
function addDeclaration(declarations: string[] | undefined, text: string, start: number, colon: number, end: number): string[] | undefined {
  if (colon === -1) {
    return declarations;
  }

  const written = text.slice(start, colon).trim();
  const value = text.slice(colon + 1, end).trim().replace(IMPORTANT_RE, ' !important');
  if (!written || !value || value === ' !important') {
    return declarations;
  }

  const name = written.startsWith('--') ? written : written.toLowerCase();
  if (!declarations) {
    return [name, value];
  }

  const index = declarations.indexOf(name);
  if (index !== -1 && index % 2 === 0) {
    declarations.splice(index, 2);
  }

  declarations.push(name, value);
  return declarations;
}

/**
 * Gives the priority a value of a style property is written with: `'important'` for a value ending with `!important`.
 *
 * @param value - The value, as {@link parseStyleDeclarations} gives it, or as a binding computes it.
 * @returns The priority, empty when there is none.
 */
export function stylePriority(value: string): string {
  return IMPORTANT_RE.test(value) ? 'important' : '';
}

/**
 * Gives a value of a style property without the `!important` it may end with (see {@link stylePriority}).
 *
 * @param value - The value, as {@link parseStyleDeclarations} gives it, or as a binding computes it.
 * @returns The value without priority.
 */
export function styleValue(value: string): string {
  return value.replace(IMPORTANT_RE, '');
}
