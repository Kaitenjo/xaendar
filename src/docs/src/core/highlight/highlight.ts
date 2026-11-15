/**
 * Languages the highlighter understands. `html` is the Xaendar template language, `error` is plain text
 * showing the output of a failure, drawn in the red of the console.
 */
export type CodeLang = 'ts' | 'html' | 'css' | 'json' | 'bash' | 'text' | 'error';

/**
 * Classes of the highlighted tokens, rendered as `<span class="tok-<class>">`. Those of TypeScript follow the scopes
 * of the TextMate grammar of VS Code: `var` a variable, `field` a property where it is declared (a field of a class,
 * a member of an interface or of a type), `key` a key of an object literal, `member` a property where it is accessed
 * (`object.member`), `param` a parameter,
 * `const` a name declared by `const`, `prim` a primitive type, `op` an operator, `br1`…`br3` the brackets, by depth.
 */
type TokenClass = 'com' | 'str' | 'num' | 'kw' | 'fn' | 'type' | 'dec' | 'punc' | 'tag' | 'attr' | 'ctl' | 'dir' | 'evt' | 'interp' | 'prop' | 'sel'
  | 'var' | 'field' | 'key' | 'member' | 'param' | 'const' | 'prim' | 'op' | 'br1' | 'br2' | 'br3';

/**
 * Kinds of the lexemes of TypeScript.
 */
type LexemeKind = 'space' | 'comment' | 'string' | 'template' | 'number' | 'decorator' | 'identifier' | 'punctuation' | 'operator' | 'other';

/**
 * A lexeme of TypeScript.
 */
interface Lexeme {
  /**
   * The kind of the lexeme.
   */
  readonly kind: LexemeKind;
  /**
   * The text of the lexeme.
   */
  readonly text: string;
}

/**
 * Kinds of the regions opened by a bracket, which decide what a `:` or a name inside them is.
 */
type FrameKind = 'block' | 'object' | 'class' | 'import' | 'params' | 'paren' | 'bracket';

/**
 * Roles of the names found by the structure of the code.
 */
type NameRole = 'param' | 'const' | 'function' | 'key' | 'objectKey' | 'type' | 'value';

/**
 * The analysis of a piece of TypeScript. Positions index `significant`, the lexemes that are neither spaces nor comments.
 */
interface TsAnalysis {
  /**
   * Every lexeme of the code.
   */
  readonly lexemes: Lexeme[];
  /**
   * The indexes, in `lexemes`, of the lexemes that are neither spaces nor comments.
   */
  readonly significant: number[];
  /**
   * The position of the closing bracket of each opening one, `<` of type arguments included.
   */
  readonly closing: Map<number, number>;
  /**
   * The position of the `<` of type arguments closed by each `>`.
   */
  readonly opening: Map<number, number>;
  /**
   * The positions of the `<` and `>` delimiting type arguments or parameters.
   */
  readonly angles: Set<number>;
  /**
   * The positions of the names in a type.
   */
  readonly types: Set<number>;
  /**
   * The roles of the names the structure of the code explains.
   */
  readonly roles: Map<number, NameRole>;
  /**
   * The positions of the `)` closing a parameter list.
   */
  readonly paramsCloses: Set<number>;
  /**
   * The positions of the `:` separating a key from its value, drawn as plain punctuation.
   */
  readonly plainColons: Set<number>;
}

/**
 * The state of the walk classifying the names of a piece of TypeScript.
 */
interface TsWalk {
  /**
   * The kinds of the regions open at the current position, innermost last.
   */
  readonly frames: FrameKind[];
  /**
   * Whether a `class` heading is waiting for its body.
   */
  pendingClass: boolean;
  /**
   * Whether an `interface` heading is waiting for its body.
   */
  pendingInterface: boolean;
  /**
   * Whether a `type` alias is waiting for its `=`.
   */
  pendingAlias: boolean;
  /**
   * Whether the walk is in the initializer of a class field.
   */
  classInit: boolean;
}

/**
 * TypeScript keywords and literals highlighted as keywords.
 */
const TS_KEYWORDS: ReadonlySet<string> = new Set([
  'abstract', 'accessor', 'as', 'asserts', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'constructor',
  'continue', 'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
  'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is', 'keyof',
  'let', 'namespace', 'new', 'null', 'of', 'override', 'private', 'protected', 'public', 'readonly', 'return', 'satisfies',
  'set', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'while',
  'with', 'yield'
]);

/**
 * Keywords that can also name a method: followed by `(` they are a call.
 */
const CONTEXTUAL_KEYWORDS: ReadonlySet<string> = new Set([
  'accessor', 'as', 'asserts', 'declare', 'from', 'get', 'infer', 'is', 'keyof', 'namespace', 'of', 'readonly', 'satisfies', 'set', 'type'
]);

/**
 * Primitive types, highlighted as such in a type.
 */
const TYPE_PRIMITIVES: ReadonlySet<string> = new Set([
  'any', 'bigint', 'boolean', 'never', 'null', 'number', 'object', 'string', 'symbol', 'undefined', 'unknown', 'void'
]);

/**
 * Primitive types highlighted as such also outside a recognized type, since they hardly ever name a variable.
 */
const PRIMITIVES: ReadonlySet<string> = new Set(['any', 'bigint', 'boolean', 'never', 'number', 'string', 'unknown']);

/**
 * Keywords preceding a type that are not the type itself.
 */
const TYPE_PREFIXES: ReadonlySet<string> = new Set(['abstract', 'asserts', 'infer', 'keyof', 'new', 'readonly', 'unique']);

/**
 * Keywords whose parenthesis holds an expression, never parameters.
 */
const CONTROL_KEYWORDS: ReadonlySet<string> = new Set(['catch', 'for', 'if', 'return', 'switch', 'while', 'with']);

/**
 * Modifiers preceding a parameter of a constructor.
 */
const PARAM_MODIFIERS: ReadonlySet<string> = new Set(['override', 'private', 'protected', 'public', 'readonly']);

/**
 * The lexemes preceding a `{` that opens an object literal.
 */
const OBJECT_PRECEDERS: ReadonlySet<string> = new Set(['(', ',', '[', 'return', 'yield', 'await', 'default']);

/**
 * The lexemes preceding a parenthesis followed by `:` that opens the parameters of an arrow function.
 */
const ARROW_PRECEDERS: ReadonlySet<string> = new Set(['=', '(', ',', 'async', 'return', '=>']);

/**
 * JSDoc tags followed by the name of a parameter.
 */
const JSDOC_NAME_TAGS: ReadonlySet<string> = new Set(['@param', '@property', '@prop', '@template', '@typeParam']);

/**
 * Lexemes of TypeScript, by capture group: space, comment, string, decorator, number, identifier, punctuation, operator.
 * Template literals and regular expressions are read apart.
 */
const TS_LEXEME_RE = /(\s+)|(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|('(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?)|(@[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)|((?:\b0x[\da-fA-F]+|\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)n?\b)|([A-Za-z_$][\w$]*)|([()[\]{},;])|(=>|\.\.\.|\?\?=?|\?\.(?!\d)|[=!]==?|&&=?|\|\|=?|\+\+|--|[-+*/%^&|]=?|[<>?:!~.=])/y;

/**
 * The kinds of the lexemes matched by the capture groups of `TS_LEXEME_RE`, in order.
 */
const LEXEME_GROUPS: readonly LexemeKind[] = ['space', 'comment', 'string', 'decorator', 'number', 'identifier', 'punctuation', 'operator'];

/**
 * The classes of the brackets, by depth.
 */
const BRACKET_CLASSES: readonly TokenClass[] = ['br1', 'br2', 'br3'];

/**
 * A regular expression literal.
 */
const TS_REGEX_RE = /\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[a-z]*/y;

/**
 * A JSDoc tag at the start of a line of a comment.
 */
const JSDOC_TAG_RE = /(?<=(?:^\/\*\*|\n[ \t]*\*?)[ \t]*)@[A-Za-z]+/g;

/**
 * The name following a JSDoc tag such as `@param`, with its optional `{type}`.
 */
const JSDOC_NAME_RE = /([ \t]+(?:\{[^}\n]*\}[ \t]+)?)([A-Za-z_$][\w$.]*)/y;

/**
 * Control-flow keywords of the template language, longest first.
 */
const CONTROL_FLOW_RE = /^@(else if|if|else|for|empty|switch|case|default|hydrate|client|placeholder|try|catch|defer|loading|error|import|let|render)\b/;

/**
 * Escapes the characters that are special in HTML.
 *
 * @param text - The text to escape.
 * @returns The escaped text.
 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, char => char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;');
}

/**
 * Wraps a token in its highlighting span.
 *
 * @param cls - The class of the token.
 * @param text - The text of the token.
 * @returns The escaped, highlighted token.
 */
function token(cls: TokenClass, text: string): string {
  return text ? `<span class="tok-${cls}">${escapeHtml(text)}</span>` : '';
}

/**
 * Finds the end of a template literal, skipping its `${…}` expressions.
 *
 * @param code - The code to scan.
 * @param start - The index of the opening backtick.
 * @returns The index following the closing backtick, or `code.length` if it is missing.
 */
function templateEnd(code: string, start: number): number {
  let index = start + 1;
  while (index < code.length) {
    const char = code[index];
    if (char === '\\') {
      index += 2;
    } else if (char === '`') {
      return index + 1;
    } else if (char === '$' && code[index + 1] === '{') {
      index = findClosing(code, index + 1, '{', '}') + 1;
    } else {
      index++;
    }
  }
  return code.length;
}

/**
 * Tells whether a `/` starts a regular expression, from the lexeme preceding it.
 *
 * @param lexemes - The lexemes read so far.
 * @returns Whether a regular expression can start here.
 */
function regexAllowed(lexemes: Lexeme[]): boolean {
  for (let i = lexemes.length - 1; i >= 0; i--) {
    const { kind, text } = lexemes[i]!;
    if (kind !== 'space' && kind !== 'comment') {
      return kind === 'operator' || (kind === 'punctuation' && !/[)\]}]/.test(text)) || (kind === 'identifier' && /^(return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/.test(text));
    }
  }
  return true;
}

/**
 * Splits TypeScript into lexemes.
 *
 * @param code - The code to split.
 * @returns The lexemes, whose texts joined give back the code.
 */
function lex(code: string): Lexeme[] {
  const lexemes = new Array<Lexeme>();
  let position = 0;
  while (position < code.length) {
    if (code[position] === '`') {
      const end = templateEnd(code, position);
      lexemes.push({ kind: 'template', text: code.slice(position, end) });
      position = end;
      continue;
    }
    if (code[position] === '/' && regexAllowed(lexemes)) {
      TS_REGEX_RE.lastIndex = position;
      const regex = TS_REGEX_RE.exec(code);
      if (regex) {
        lexemes.push({ kind: 'string', text: regex[0] });
        position += regex[0].length;
        continue;
      }
    }
    TS_LEXEME_RE.lastIndex = position;
    const match = TS_LEXEME_RE.exec(code);
    if (match) {
      const group = match.findIndex((value, index) => index > 0 && value !== undefined);
      lexemes.push({ kind: LEXEME_GROUPS[group - 1]!, text: match[0] });
      position += match[0].length;
    } else {
      lexemes.push({ kind: 'other', text: code[position]! });
      position++;
    }
  }
  return lexemes;
}

/**
 * Reads the text of a significant lexeme.
 *
 * @param analysis - The analysis of the code.
 * @param position - The position of the lexeme among the significant ones.
 * @returns Its text, or `''` past the ends.
 */
function textAt(analysis: TsAnalysis, position: number): string {
  return position < 0 ? '' : analysis.lexemes[analysis.significant[position]!]?.text ?? '';
}

/**
 * Reads the kind of a significant lexeme.
 *
 * @param analysis - The analysis of the code.
 * @param position - The position of the lexeme among the significant ones.
 * @returns Its kind, or `undefined` past the ends.
 */
function kindAt(analysis: TsAnalysis, position: number): LexemeKind | undefined {
  return position < 0 ? undefined : analysis.lexemes[analysis.significant[position]!]?.kind;
}

/**
 * Tries to read type arguments or parameters from a `<` following a name with no space between them.
 *
 * @param analysis - The analysis of the code.
 * @param open - The position of the `<`.
 * @returns The position of the matching `>`, or `-1` when the `<` is a comparison.
 */
function typeArgumentsEnd(analysis: TsAnalysis, open: number): number {
  let depth = 1;
  for (let position = open + 1; position < analysis.significant.length && position < open + 200; position++) {
    const text = textAt(analysis, position);
    const kind = kindAt(analysis, position);
    if (text === '<') {
      depth++;
    } else if (text === '>') {
      if (--depth === 0) {
        const next = kindAt(analysis, position + 1);
        const keyword = /^(extends|implements|as|satisfies|is)$/.test(textAt(analysis, position + 1));
        return next === 'number' || (next === 'identifier' && !keyword) ? -1 : position;
      }
    } else if (text === '(' || text === '[' || text === '{') {
      const close = analysis.closing.get(position);
      if (close === undefined) {
        return -1;
      }
      position = close;
    } else if (!(kind === 'identifier' || kind === 'string' || kind === 'number' || kind === 'template' || /^(,|\.|\||&|\?|:|=|=>|\.\.\.|-)$/.test(text))) {
      return -1;
    }
  }
  return -1;
}

/**
 * Marks the names inside a bracket of a type: keys and parameters as such, the others as types.
 *
 * @param analysis - The analysis of the code.
 * @param from - The first position inside the bracket.
 * @param to - The position of the closing bracket.
 * @param open - The opening bracket.
 */
function markTypeBody(analysis: TsAnalysis, from: number, to: number, open: string): void {
  const containers = [open];
  for (let position = from; position < to; position++) {
    const text = textAt(analysis, position);
    if (text === '(' || text === '[' || text === '{' || (text === '<' && analysis.angles.has(position) && analysis.closing.has(position))) {
      containers.push(text);
      continue;
    }
    if (text === ')' || text === ']' || text === '}' || (text === '>' && analysis.angles.has(position))) {
      containers.pop();
      continue;
    }
    if (kindAt(analysis, position) !== 'identifier') {
      continue;
    }
    const next = textAt(analysis, position + 1);
    const container = containers.at(-1);
    const afterOptional = next === '?' ? textAt(analysis, position + 2) : next;
    const isKey = afterOptional === ':' || (container === '{' && afterOptional === '(');
    if (textAt(analysis, position - 1) === 'typeof') {
      analysis.roles.set(position, 'value');
    } else if (isKey && container === '{' && afterOptional === '(') {
      analysis.roles.set(position, 'function');
    } else if (isKey && container === '(') {
      analysis.roles.set(position, 'param');
    } else if (isKey && container !== '<') {
      analysis.roles.set(position, 'key');
    } else {
      analysis.types.add(position);
    }
  }
}

/**
 * Marks the names of the type starting at a position, and finds where it ends.
 *
 * @param analysis - The analysis of the code.
 * @param start - The position of the first lexeme of the type.
 * @returns The position following the type.
 */
function scanType(analysis: TsAnalysis, start: number): number {
  let position = start;
  let expectOperand = true;
  let afterGroup = false;
  let conditionals = 0;
  while (position < analysis.significant.length) {
    const text = textAt(analysis, position);
    const kind = kindAt(analysis, position);
    if (expectOperand) {
      if (kind === 'identifier' && text === 'typeof') {
        position++;
        if (kindAt(analysis, position) === 'identifier') {
          analysis.roles.set(position, 'value');
          position++;
          expectOperand = false;
        }
      } else if (kind === 'identifier') {
        analysis.types.add(position);
        position++;
        expectOperand = TYPE_PREFIXES.has(text);
        afterGroup = false;
      } else if (kind === 'string' || kind === 'number' || kind === 'template') {
        position++;
        expectOperand = false;
        afterGroup = false;
      } else if (text === '(' || text === '[' || text === '{') {
        const close = analysis.closing.get(position);
        if (close === undefined) {
          return position;
        }
        markTypeBody(analysis, position + 1, close, text);
        position = close + 1;
        expectOperand = false;
        afterGroup = text === '(';
      } else if (/^(\||&|\.\.\.|-)$/.test(text)) {
        position++;
      } else {
        return position;
      }
      continue;
    }
    if (text === '.' || text === '|' || text === '&' || (text === '=>' && afterGroup)) {
      position++;
      expectOperand = true;
    } else if ((text === '<' && analysis.angles.has(position)) || text === '[') {
      const close = analysis.closing.get(position);
      if (close === undefined) {
        return position;
      }
      markTypeBody(analysis, position + 1, close, text);
      position = close + 1;
    } else if (text === 'extends' || text === 'is') {
      if (text === 'is' && kindAt(analysis, position - 1) === 'identifier') {
        analysis.types.delete(position - 1);
        analysis.roles.set(position - 1, 'param');
      }
      conditionals += text === 'extends' ? 1 : 0;
      analysis.types.add(position);
      position++;
      expectOperand = true;
    } else if ((text === '?' || text === ':') && conditionals) {
      conditionals -= text === ':' ? 1 : 0;
      position++;
      expectOperand = true;
    } else {
      return position;
    }
    afterGroup = false;
  }
  return position;
}

/**
 * Marks the types of a comma-separated list, such as the one following `implements`.
 *
 * @param analysis - The analysis of the code.
 * @param start - The position of the first type.
 * @returns The position following the list.
 */
function scanTypeList(analysis: TsAnalysis, start: number): number {
  let position = scanType(analysis, start);
  while (textAt(analysis, position) === ',') {
    position = scanType(analysis, position + 1);
  }
  return position;
}

/**
 * Tells whether the parenthesis at a position opens the parameters of a function.
 *
 * @param analysis - The analysis of the code.
 * @param open - The position of the `(`.
 * @param frame - The kind of the region containing it.
 * @returns Whether it opens a parameter list.
 */
function isParamList(analysis: TsAnalysis, open: number, frame: FrameKind): boolean {
  const close = analysis.closing.get(open);
  if (close === undefined) {
    return false;
  }
  const next = textAt(analysis, close + 1);
  const previous = textAt(analysis, open - 1);
  if (next === '=>' || previous === 'function') {
    return true;
  }
  const name = previous === '>' && analysis.opening.has(open - 1) ? analysis.opening.get(open - 1)! - 1 : open - 1;
  if (kindAt(analysis, name) === 'identifier' && !CONTROL_KEYWORDS.has(textAt(analysis, name)) && textAt(analysis, name - 1) !== '.') {
    const declared = textAt(analysis, name - 1) === 'function';
    if (declared || next === '{' || (next === ':' && (frame === 'class' || frame === 'object'))) {
      return true;
    }
  }
  return next === ':' && ARROW_PRECEDERS.has(previous);
}

/**
 * Marks the names declared by a parameter list.
 *
 * @param analysis - The analysis of the code.
 * @param open - The position of its `(`.
 */
function markParams(analysis: TsAnalysis, open: number): void {
  const close = analysis.closing.get(open)!;
  analysis.paramsCloses.add(close);
  let expectName = true;
  for (let position = open + 1; position < close; position++) {
    const text = textAt(analysis, position);
    const end = analysis.closing.get(position);
    if (end !== undefined) {
      if (expectName && (text === '{' || text === '[')) {
        for (let inner = position + 1; inner < end; inner++) {
          if (kindAt(analysis, inner) === 'identifier' && textAt(analysis, inner + 1) !== ':') {
            analysis.roles.set(inner, 'param');
          }
        }
      }
      position = end;
      expectName = false;
    } else if (text === ',') {
      expectName = true;
    } else if (kindAt(analysis, position) === 'identifier' && expectName) {
      if (!PARAM_MODIFIERS.has(text)) {
        if (text !== 'this') {
          analysis.roles.set(position, 'param');
        }
        expectName = false;
      }
    } else if (text !== '...') {
      expectName = false;
    }
  }
}

/**
 * Tells whether the value following a `=` is a function.
 *
 * @param analysis - The analysis of the code.
 * @param equals - The position of the `=`.
 * @returns Whether an arrow function or a function expression follows.
 */
function isFunctionValue(analysis: TsAnalysis, equals: number): boolean {
  if (textAt(analysis, equals) !== '=') {
    return false;
  }
  const start = textAt(analysis, equals + 1) === 'async' ? equals + 2 : equals + 1;
  const text = textAt(analysis, start);
  if (text === 'function') {
    return true;
  }
  if (text === '(') {
    const close = analysis.closing.get(start);
    return close !== undefined && /^(=>|:)$/.test(textAt(analysis, close + 1));
  }
  return kindAt(analysis, start) === 'identifier' && textAt(analysis, start + 1) === '=>';
}

/**
 * Marks the names declared by `const`, `let` or `var`, with their type.
 *
 * @param analysis - The analysis of the code.
 * @param keyword - The position of the keyword.
 * @returns The position where the walk goes on.
 */
function markDeclaration(analysis: TsAnalysis, keyword: number): number {
  const role: NameRole = textAt(analysis, keyword) === 'const' ? 'const' : 'value';
  const binding = keyword + 1;
  let last = binding;
  if (kindAt(analysis, binding) === 'identifier') {
    analysis.roles.set(binding, isFunctionValue(analysis, binding + 1) || (textAt(analysis, binding + 1) === ':' && textAt(analysis, binding + 2) === '(') ? 'function' : role);
  } else if (textAt(analysis, binding) === '{' || textAt(analysis, binding) === '[') {
    last = analysis.closing.get(binding) ?? binding;
    for (let position = binding + 1; position < last; position++) {
      if (kindAt(analysis, position) === 'identifier' && textAt(analysis, position + 1) !== ':') {
        analysis.roles.set(position, role);
      }
    }
  } else {
    return keyword;
  }
  return textAt(analysis, last + 1) === ':' ? scanType(analysis, last + 2) - 1 : last;
}

/**
 * Tells what the `{` at a position opens.
 *
 * @param analysis - The analysis of the code.
 * @param open - The position of the `{`.
 * @param walk - The state of the walk.
 * @returns The kind of the region.
 */
function braceKind(analysis: TsAnalysis, open: number, walk: TsWalk): FrameKind {
  const previous = textAt(analysis, open - 1);
  const kind = kindAt(analysis, open - 1);
  if (walk.pendingClass) {
    return 'class';
  }
  if (previous === 'import' || previous === 'export' || (previous === 'type' && textAt(analysis, open - 2) === 'import')) {
    return 'import';
  }
  return OBJECT_PRECEDERS.has(previous) || (kind === 'operator' && previous !== '=>') ? 'object' : 'block';
}

/**
 * Walks the significant lexemes, marking the role of each name from the structure of the code around it.
 *
 * @param analysis - The analysis of the code.
 */
function walkTs(analysis: TsAnalysis): void {
  const walk: TsWalk = { frames: [], pendingClass: false, pendingInterface: false, pendingAlias: false, classInit: false };
  for (let position = 0; position < analysis.significant.length; position++) {
    const text = textAt(analysis, position);
    const kind = kindAt(analysis, position);
    const frame = walk.frames.at(-1) ?? 'block';
    if (kind === 'punctuation') {
      switch (text) {
        case '(': {
          const params = isParamList(analysis, position, frame);
          if (params) {
            markParams(analysis, position);
          }
          walk.frames.push(params ? 'params' : 'paren');
          break;
        }
        case '[':
          walk.frames.push('bracket');
          break;
        case '{':
          if (walk.pendingInterface && analysis.closing.has(position)) {
            const close = analysis.closing.get(position)!;
            markTypeBody(analysis, position + 1, close, '{');
            walk.pendingInterface = false;
            position = close;
          } else {
            walk.frames.push(braceKind(analysis, position, walk));
            walk.pendingClass = false;
          }
          break;
        case ')':
        case ']':
        case '}':
          walk.frames.pop();
          break;
        case ';':
          walk.classInit = false;
          break;
      }
      continue;
    }
    if (kind === 'operator') {
      if (text === '<' && analysis.angles.has(position) && analysis.closing.has(position)) {
        const close = analysis.closing.get(position)!;
        markTypeBody(analysis, position + 1, close, '<');
        position = close;
      } else if (text === ':') {
        position = walkColon(analysis, position, frame, walk);
      } else if (text === '=' && walk.pendingAlias) {
        walk.pendingAlias = false;
        position = scanType(analysis, position + 1) - 1;
      } else if (text === '=' && frame === 'class') {
        walk.classInit = true;
      }
      continue;
    }
    if (kind === 'identifier' && !/^(\.|\?\.)$/.test(textAt(analysis, position - 1))) {
      position = walkName(analysis, position, frame, walk);
    }
  }
}

/**
 * Handles a `:` met by the walk: a key separator, the start of a type annotation, or an operator.
 *
 * @param analysis - The analysis of the code.
 * @param colon - The position of the `:`.
 * @param frame - The kind of the region containing it.
 * @param walk - The state of the walk.
 * @returns The position where the walk goes on.
 */
function walkColon(analysis: TsAnalysis, colon: number, frame: FrameKind, walk: TsWalk): number {
  const previous = textAt(analysis, colon - 1);
  if (previous === ')' && analysis.paramsCloses.has(colon - 1)) {
    return scanType(analysis, colon + 1) - 1;
  }
  if (frame === 'object' && /^[{,]$/.test(textAt(analysis, colon - 2))) {
    analysis.plainColons.add(colon);
    if (kindAt(analysis, colon - 1) === 'identifier') {
      analysis.roles.set(colon - 1, 'objectKey');
    }
    return colon;
  }
  if ((frame === 'class' && !walk.classInit) || frame === 'params') {
    return scanType(analysis, colon + 1) - 1;
  }
  return colon;
}

/**
 * Handles a name met by the walk: a keyword introducing declarations or types, or a name whose role its neighbors tell.
 *
 * @param analysis - The analysis of the code.
 * @param position - The position of the name.
 * @param frame - The kind of the region containing it.
 * @param walk - The state of the walk.
 * @returns The position where the walk goes on.
 */
function walkName(analysis: TsAnalysis, position: number, frame: FrameKind, walk: TsWalk): number {
  const text = textAt(analysis, position);
  const next = textAt(analysis, position + 1);
  const nextIsName = kindAt(analysis, position + 1) === 'identifier';
  switch (text) {
    case 'const':
    case 'let':
    case 'var':
      return markDeclaration(analysis, position);
    case 'function':
      if (nextIsName) {
        analysis.roles.set(position + 1, 'function');
      }
      return position;
    case 'class':
    case 'interface':
      walk.pendingClass = text === 'class';
      walk.pendingInterface = text === 'interface';
      if (nextIsName && next !== 'extends' && next !== 'implements') {
        analysis.roles.set(position + 1, 'type');
      }
      return position;
    case 'type':
      if (nextIsName && (textAt(analysis, position + 2) === '=' || analysis.angles.has(position + 2))) {
        analysis.roles.set(position + 1, 'type');
        walk.pendingAlias = true;
      }
      return position;
    case 'enum':
    case 'new':
    case 'instanceof':
      if (nextIsName) {
        analysis.roles.set(position + 1, 'type');
      }
      return position;
    case 'extends':
    case 'implements':
      return walk.pendingClass || walk.pendingInterface ? scanTypeList(analysis, position + 1) - 1 : position;
    case 'as':
    case 'satisfies':
      return frame === 'import' || textAt(analysis, position - 1) === '*' ? position : scanType(analysis, position + 1) - 1;
  }
  
  if (next === '=>') {
    analysis.roles.set(position, 'param');
  } else if (frame === 'class' && !walk.classInit && /^[:;=?!]$/.test(next) && !TS_KEYWORDS.has(text)) {
    analysis.roles.set(position, 'key');
  }
  return position;
}

/**
 * Analyzes a piece of TypeScript: its lexemes, brackets and type arguments, and the roles of its names.
 *
 * @param code - The code to analyze.
 * @param asType - Whether the whole code is a type, as the type arguments of a template tag.
 * @returns The analysis.
 */
function analyzeTs(code: string, asType: boolean): TsAnalysis {
  const lexemes = lex(code);
  const significant = new Array<number>();
  for (let i = 0; i < lexemes.length; i++) {
    if (lexemes[i]!.kind !== 'space' && lexemes[i]!.kind !== 'comment') {
      significant.push(i);
    }
  }

  const analysis: TsAnalysis = {
    lexemes, significant, closing: new Map(), opening: new Map(), angles: new Set(), types: new Set(), roles: new Map(),
    paramsCloses: new Set(), plainColons: new Set()
  };

  const open = new Array<number>();
  for (let position = 0; position < significant.length; position++) {
    const text = textAt(analysis, position);
    if (text === '(' || text === '[' || text === '{') {
      open.push(position);
    } else if ((text === ')' || text === ']' || text === '}') && open.length) {
      analysis.closing.set(open.pop()!, position);
    }
  }

  for (let position = 0; position < significant.length; position++) {
    const before = lexemes[significant[position]! - 1]?.kind;
    if (textAt(analysis, position) === '<' && (before === 'identifier' || before === 'decorator') && !analysis.angles.has(position)) {
      const close = typeArgumentsEnd(analysis, position);
      if (close > 0) {
        analysis.closing.set(position, close);
        analysis.opening.set(close, position);
        analysis.angles.add(position).add(close);
      }
    }
  }

  asType ? markTypeBody(analysis, 0, significant.length, '<') : walkTs(analysis);
  return analysis;
}

/**
 * Classifies a name from its role, its context and its neighbors.
 *
 * @param analysis - The analysis of the code.
 * @param position - The position of the name.
 * @returns The class of the name.
 */
function classifyName(analysis: TsAnalysis, position: number): TokenClass {
  const text = textAt(analysis, position);
  const previous = textAt(analysis, position - 1);
  const next = textAt(analysis, position + 1);
  const role = analysis.roles.get(position);
  const isCall = next === '(' || (next === '<' && analysis.closing.has(position + 1) && textAt(analysis, analysis.closing.get(position + 1)! + 1) === '(');
  if (previous === '.' || previous === '?.') {
    return isCall ? 'fn' : analysis.types.has(position) ? 'type' : 'member';
  }
  switch (role) {
    case 'param':
      return 'param';
    case 'key':
      return isCall ? 'fn' : 'field';
    case 'objectKey':
      return 'key';
    case 'value':
      return 'var';
    case 'const':
      return 'const';
    case 'function':
      return 'fn';
    case 'type':
      return 'type';
  }
  if (analysis.types.has(position)) {
    return TYPE_PRIMITIVES.has(text) ? 'prim' : TS_KEYWORDS.has(text) ? 'kw' : 'type';
  }
  if (PRIMITIVES.has(text)) {
    return 'prim';
  }
  if (TS_KEYWORDS.has(text)) {
    return isCall && CONTEXTUAL_KEYWORDS.has(text) ? 'fn' : 'kw';
  }
  return isCall ? 'fn' : 'var';
}

/**
 * Classifies the significant lexemes of a piece of TypeScript, the brackets by their depth.
 *
 * @param analysis - The analysis of the code.
 * @returns The class of each lexeme, by its index in `lexemes`, `undefined` for plain text.
 */
function classifyTs(analysis: TsAnalysis): Array<TokenClass | undefined> {
  const classes = new Array<TokenClass | undefined>(analysis.lexemes.length);
  const brackets = new Map<number, TokenClass>();
  let depth = 0;
  for (let position = 0; position < analysis.significant.length; position++) {
    const { kind, text } = analysis.lexemes[analysis.significant[position]!]!;
    let cls: TokenClass | undefined;
    if (analysis.closing.has(position)) {
      cls = BRACKET_CLASSES[depth % 3]!;
      brackets.set(analysis.closing.get(position)!, cls);
      depth++;
    } else if (brackets.has(position)) {
      cls = brackets.get(position);
      depth = Math.max(0, depth - 1);
    } else {
      switch (kind) {
        case 'string':
          cls = 'str';
          break;
        case 'number':
          cls = 'num';
          break;
        case 'decorator':
          cls = 'dec';
          break;
        case 'identifier':
          cls = classifyName(analysis, position);
          break;
        case 'operator':
          cls = text === '.' || text === '?.' || analysis.plainColons.has(position) ? undefined : 'op';
          break;
        case 'punctuation':
          cls = /^[()[\]{}]$/.test(text) ? 'br1' : undefined;
          break;
      }
    }
    classes[analysis.significant[position]!] = cls;
  }
  return classes;
}

/**
 * Highlights a comment; in a JSDoc block, its tags and the names of the parameters they document too.
 *
 * @param comment - The comment.
 * @returns The highlighted HTML.
 */
function highlightComment(comment: string): string {
  if (!comment.startsWith('/**')) {
    return token('com', comment);
  }
  let out = '';
  let last = 0;
  for (const match of comment.matchAll(JSDOC_TAG_RE)) {
    out = `${out}${token('com', comment.slice(last, match.index))}${token('kw', match[0])}`;
    last = match.index + match[0].length;
    JSDOC_NAME_RE.lastIndex = last;
    const name = JSDOC_NAME_TAGS.has(match[0]) ? JSDOC_NAME_RE.exec(comment) : null;
    if (name) {
      out = `${out}${token('com', name[1]!)}${token('var', name[2]!)}`;
      last += name[0].length;
    }
  }
  return `${out}${token('com', comment.slice(last))}`;
}

/**
 * Highlights a template literal: its text as a string, its `${…}` expressions as code.
 *
 * @param literal - The template literal, backticks included.
 * @returns The highlighted HTML.
 */
function highlightTemplateLiteral(literal: string): string {
  let out = '';
  let text = '';
  let index = 0;
  while (index < literal.length) {
    if (literal[index] === '\\') {
      text = `${text}${literal.slice(index, index + 2)}`;
      index += 2;
    } else if (literal[index] === '$' && literal[index + 1] === '{') {
      const close = findClosing(literal, index + 1, '{', '}');
      out = `${out}${token('str', text)}${token('kw', '${')}${highlightTs(literal.slice(index + 2, close))}${token('kw', literal[close] ?? '')}`;
      text = '';
      index = close + 1;
    } else {
      text = `${text}${literal[index]}`;
      index++;
    }
  }
  return `${out}${token('str', text)}`;
}

/**
 * Highlights TypeScript (or JavaScript) code, with the classes of the scopes of VS Code: the names are told apart by
 * the structure of the code around them (declarations, parameter lists, types, calls, properties).
 *
 * @param code - The code to highlight.
 * @param asType - Whether the whole code is a type, as the type arguments of a template tag.
 * @returns The highlighted HTML.
 */
function highlightTs(code: string, asType = false): string {
  const analysis = analyzeTs(code, asType);
  const classes = classifyTs(analysis);
  let out = '';
  for (let i = 0; i < analysis.lexemes.length; i++) {
    const { kind, text } = analysis.lexemes[i]!;
    const cls = classes[i];
    if (kind === 'comment') {
      out = `${out}${highlightComment(text)}`;
    } else if (kind === 'template') {
      out = `${out}${highlightTemplateLiteral(text)}`;
    } else {
      out = `${out}${cls ? token(cls, text) : escapeHtml(text)}`;
    }
  }
  return out;
}

/**
 * Finds the end of a balanced region, ignoring the delimiters inside string literals.
 *
 * @param code - The code to scan.
 * @param start - The index of the opening delimiter.
 * @param open - The opening delimiter.
 * @param close - The closing delimiter.
 * @returns The index of the matching closing delimiter, or `code.length` if it is missing.
 */
function findClosing(code: string, start: number, open: string, close: string): number {
  let depth = 0;
  let quote = '';
  for (let index = start; index < code.length; index++) {
    const char = code[index];
    if (quote) {
      if (char === '\\') {
        index++;
      } else if (char === quote) {
        quote = '';
      }
    } else if (char === '\'' || char === '"' || char === '`') {
      quote = char;
    } else if (char === open) {
      depth++;
    } else if (char === close && --depth === 0) {
      return index;
    }
  }
  return code.length;
}

/**
 * Highlights code in the Xaendar template language: HTML extended with interpolations,
 * control flow, event bindings, directives and conditional bindings.
 *
 * @param code - The template to highlight.
 * @returns The highlighted HTML.
 */
function highlightTemplate(code: string): string {
  let out = '';
  let position = 0;
  let text = '';
  const flushText = (): void => {
    out = `${out}${escapeHtml(text)}`;
    text = '';
  };

  /**
   * Highlights a `(condition)` and the `{` opening a block, if present at the cursor.
   */
  const blockHeader = (): void => {
    const space = /^\s*/.exec(code.slice(position))![0];
    if (code[position + space.length] === '(') {
      const end = findClosing(code, position + space.length, '(', ')');
      out = `${out}${escapeHtml(space)}${token('punc', '(')}${highlightTs(code.slice(position + space.length + 1, end))}${token('punc', code[end] ?? '')}`;
      position = end + 1;
    }
    const after = /^\s*/.exec(code.slice(position))![0];
    if (code[position + after.length] === '{') {
      out = `${out}${escapeHtml(after)}${token('punc', '{')}`;
      position += after.length + 1;
    }
  };

  /**
   * Highlights the tag starting at the cursor, with the type arguments following its name, up to its closing `>`.
   */
  const tag = (): void => {
    const name = /^<\/?\s*[^\s/>(]*/.exec(code.slice(position))![0];
    out = `${out}${token('punc', name.startsWith('</') ? '</' : '<')}${token('tag', name.replace(/^<\/?/, ''))}`;
    position += name.length;
    if (code[position] === '(') {
      const end = findClosing(code, position, '(', ')');
      out = `${out}${token('punc', '(')}${highlightTs(code.slice(position + 1, end), true)}${token('punc', code[end] ?? '')}`;
      position = end + 1;
    }
    // Whether the next quoted value is the handler of an event binding
    let handler = false;
    while (position < code.length) {
      const rest = code.slice(position);
      let match: RegExpExecArray | null;
      if ((match = /^\s+/.exec(rest))) {
        out = `${out}${escapeHtml(match[0])}`;
      } else if ((match = /^\/?>/.exec(rest))) {
        out = `${out}${token('punc', match[0])}`;
        position += match[0].length;
        return;
      } else if ((match = /^(?:@@|\*)[\w-]+/.exec(rest))) {
        out = `${out}${token('dir', match[0])}`;
      } else if ((match = CONTROL_FLOW_RE.exec(rest))) {
        out = `${out}${token('ctl', match[0])}`;
        position += match[0].length;
        blockHeader();
        continue;
      } else if ((match = /^\([^\s()="'>/]+\)/.exec(rest))) {
        out = `${out}${token('evt', match[0])}`;
        handler = true;
      } else if ((match = /^[()}]/.exec(rest))) {
        out = `${out}${token('punc', match[0])}`;
      } else if ((match = /^=/.exec(rest))) {
        out = `${out}${token('punc', '=')}`;
      } else if ((match = /^"([^"]*)"?/.exec(rest))) {
        const value = match[1] ?? '';
        const closing = match[0].endsWith('"') && match[0].length > 1 ? '"' : '';
        if (handler) {
          out = `${out}${token('punc', '"')}${highlightTs(value)}${token('punc', closing)}`;
        } else if (value.trimStart().startsWith('{')) {
          const open = value.indexOf('{');
          const close = value.lastIndexOf('}');
          out = `${out}${token('punc', '"')}${escapeHtml(value.slice(0, open))}${token('interp', '{')}${highlightTs(value.slice(open + 1, close < 0 ? value.length : close))}${token('interp', close < 0 ? '' : '}')}${escapeHtml(close < 0 ? '' : value.slice(close + 1))}${token('punc', closing)}`;
        } else {
          out = `${out}${token('str', match[0])}`;
        }
        handler = false;
      } else if ((match = /^[^\s=>/()"{}]+/.exec(rest))) {
        out = `${out}${token('attr', match[0])}`;
        handler = false;
      } else {
        match = /^./s.exec(rest)!;
        out = `${out}${escapeHtml(match[0])}`;
      }
      position += match[0].length;
    }
  };

  while (position < code.length) {
    const rest = code.slice(position);
    let match: RegExpExecArray | null;
    if (rest.startsWith('<!--')) {
      flushText();
      const end = code.indexOf('-->', position);
      const stop = end < 0 ? code.length : end + 3;
      out = `${out}${token('com', code.slice(position, stop))}`;
      position = stop;
    } else if (/^<\/?[A-Za-z]/.test(rest)) {
      flushText();
      tag();
    } else if ((match = /^@import\b[^\n]*/.exec(rest))) {
      flushText();
      out = `${out}${token('ctl', '@import')}${highlightTs(match[0].slice('@import'.length))}`;
      position += match[0].length;
    } else if ((match = CONTROL_FLOW_RE.exec(rest))) {
      flushText();
      out = `${out}${token('ctl', match[0])}`;
      position += match[0].length;
      blockHeader();
    } else {
      switch (rest[0]) {
        case '{': {
          flushText();
          const end = findClosing(code, position, '{', '}');
          out = `${out}${token('interp', '{')}${highlightTs(code.slice(position + 1, end))}${token('interp', code[end] ?? '')}`;
          position = end + 1;
          break;
        }
        case '}':
          flushText();
          out = `${out}${token('punc', '}')}`;
          position++;
          break;
        default:
          text = `${text}${rest[0]}`;
          position++;
      }
    }
  }
  flushText();
  return out;
}

/**
 * Highlights CSS.
 *
 * @param code - The stylesheet to highlight.
 * @returns The highlighted HTML.
 */
function highlightCss(code: string): string {
  let out = '';
  let position = 0;
  // Whether each open block contains rules (at-rules such as @media) or declarations
  const blocks: Array<'rules' | 'declarations'> = [];
  let pendingAtRule = '';
  while (position < code.length) {
    const rest = code.slice(position);
    const inDeclarations = blocks.at(-1) === 'declarations';
    let match: RegExpExecArray | null;
    // Comments, strings and at-rules never start with a brace: braces are handled first
    switch (rest[0]) {
      case '{':
        match = /^\{/.exec(rest)!;
        blocks.push(pendingAtRule && !/^@(font-face|page|property|counter-style)$/.test(pendingAtRule) ? 'rules' : 'declarations');
        pendingAtRule = '';
        out = `${out}${token('punc', '{')}`;
        break;
      case '}':
        match = /^\}/.exec(rest)!;
        blocks.pop();
        out = `${out}${token('punc', '}')}`;
        break;
      default:
        if ((match = /^\/\*[\s\S]*?(?:\*\/|$)/.exec(rest))) {
          out = `${out}${token('com', match[0])}`;
        } else if ((match = /^('(?:\\.|[^'\\])*'?|"(?:\\.|[^"\\])*"?)/.exec(rest))) {
          out = `${out}${token('str', match[0])}`;
        } else if ((match = /^@[\w-]+/.exec(rest))) {
          pendingAtRule = match[0];
          out = `${out}${token('kw', match[0])}`;
        } else if (!inDeclarations && !pendingAtRule && (match = /^[^{}@/'"]+/.exec(rest))) {
          const selector = match[0];
          const trimmed = selector.trim();
          out = `${out}${trimmed ? `${escapeHtml(selector.slice(0, selector.indexOf(trimmed)))}${token('sel', trimmed)}${escapeHtml(selector.slice(selector.indexOf(trimmed) + trimmed.length))}` : escapeHtml(selector)}`;
        } else if (inDeclarations && (match = /^(--[\w-]+|-?[a-zA-Z][\w-]*)(?=\s*:)/.exec(rest)) && /(^|[;{]\s*)$/.test(out.replace(/<[^>]*>/g, '').slice(-200))) {
          out = `${out}${token('prop', match[0])}`;
        } else if ((match = /^#[\da-fA-F]{3,8}\b|^-?\d*\.?\d+(?:%|[a-zA-Z]+)?/.exec(rest))) {
          out = `${out}${token('num', match[0])}`;
        } else if ((match = /^!important\b/.exec(rest))) {
          out = `${out}${token('kw', match[0])}`;
        } else if ((match = /^[\w-]+(?=\()/.exec(rest))) {
          out = `${out}${token('fn', match[0])}`;
        } else {
          match = /^[\s\S][^{}@/'"#\d!\w-]*/.exec(rest)!;
          if (match[0].includes(';')) {
            pendingAtRule = '';
          }
          out = `${out}${escapeHtml(match[0])}`;
        }
    }
    position += match[0].length;
  }
  return out;
}

/**
 * Highlights JSON.
 *
 * @param code - The JSON to highlight.
 * @returns The highlighted HTML.
 */
function highlightJson(code: string): string {
  return code.replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([&<>])/g, (all, string: string | undefined, colon: string | undefined, literal: string | undefined, number: string | undefined) => {
    if (string) {
      return colon ? `${token('attr', string)}${colon}` : token('str', string);
    }
    if (literal) {
      return token('kw', literal);
    }
    if (number) {
      return token('num', number);
    }
    return escapeHtml(all);
  });
}

/**
 * Highlights shell commands: the command name, its flags, strings and comments.
 *
 * @param code - The commands to highlight.
 * @returns The highlighted HTML.
 */
function highlightBash(code: string): string {
  return code.split('\n').map(line => {
    const comment = /(^|\s)#.*$/.exec(line);
    const command = comment ? line.slice(0, comment.index) : line;
    let first = true;
    const highlighted = command.replace(/('[^']*'|"[^"]*")|(--?[\w-]+)|([^\s'"]+)|(\s+)/g, (all, string: string | undefined, flag: string | undefined, word: string | undefined) => {
      if (string) {
        first = false;
        return token('str', string);
      }
      if (flag && !first) {
        return token('attr', flag);
      }
      if (word || flag) {
        if (/^[$>]$/.test(all)) {
          return escapeHtml(all);
        }
        const wasFirst = first;
        first = false;
        return wasFirst ? token('fn', all) : escapeHtml(all);
      }
      return all;
    });
    return comment ? `${highlighted}${escapeHtml(comment[1]!)}${token('com', comment[0].slice(comment[1]!.length))}` : highlighted;
  }).join('\n');
}

/**
 * Highlights code, producing HTML made of escaped text and `<span class="tok-*">` tokens. The line breaks of files
 * saved with CRLF become LF: a `\r` left in a token would be drawn as one more line break.
 *
 * @param code - The code to highlight.
 * @param lang - The language of the code.
 * @returns The highlighted HTML, safe to assign to `innerHTML`.
 */
export function highlight(code: string, lang: CodeLang): string {
  const text = code.replace(/\r\n?/g, '\n');
  switch (lang) {
    case 'ts':
      return highlightTs(text);
    case 'html':
      return highlightTemplate(text);
    case 'css':
      return highlightCss(text);
    case 'json':
      return highlightJson(text);
    case 'bash':
      return highlightBash(text);
    default:
      return escapeHtml(text);
  }
}
