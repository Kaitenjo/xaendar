/**
 * Languages the highlighter understands. `html` is the Xaendar template language.
 */
export type CodeLang = 'ts' | 'html' | 'css' | 'json' | 'bash' | 'text';

/**
 * Classes of the highlighted tokens, rendered as `<span class="tok-<class>">`.
 */
type TokenClass = 'com' | 'str' | 'num' | 'kw' | 'fn' | 'type' | 'dec' | 'punc' | 'tag' | 'attr' | 'ctl' | 'dir' | 'evt' | 'interp' | 'prop' | 'sel';

/**
 * TypeScript keywords and literals highlighted as keywords.
 */
const TS_KEYWORDS: ReadonlySet<string> = new Set([
  'abstract', 'accessor', 'any', 'as', 'async', 'await', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
  'get', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'keyof', 'let', 'never', 'new', 'null', 'number',
  'of', 'private', 'protected', 'public', 'readonly', 'return', 'satisfies', 'set', 'static', 'string', 'super', 'switch',
  'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'unknown', 'var', 'void', 'while', 'yield'
]);

/**
 * Tokens of TypeScript, by capture group: comment, string, decorator, number, identifier.
 */
const TS_TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?)|(@[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)|(\b(?:0x[\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?)\b)|([A-Za-z_$][\w$]*)/g;

/**
 * Control-flow keywords of the template language, longest first.
 */
const CONTROL_FLOW_RE = /^@(else if|if|else|for|switch|case|default|import)\b/;

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
 * Highlights TypeScript (or JavaScript) code.
 *
 * @param code - The code to highlight.
 * @returns The highlighted HTML.
 */
function highlightTs(code: string): string {
  let out = '';
  let last = 0;
  for (const match of code.matchAll(TS_TOKEN_RE)) {
    out += escapeHtml(code.slice(last, match.index));
    last = match.index + match[0].length;
    const [text, comment, string, decorator, number, identifier] = match;
    if (comment) {
      out += token('com', comment);
    } else if (string) {
      out += token('str', string);
    } else if (decorator) {
      out += token('dec', decorator);
    } else if (number) {
      out += token('num', number);
    } else if (identifier) {
      const isProperty = code[match.index - 1] === '.';
      if (!isProperty && TS_KEYWORDS.has(identifier)) {
        out += token('kw', identifier);
      } else if (/^\s*\(/.test(code.slice(last))) {
        out += token('fn', identifier);
      } else if (!isProperty && /^[A-Z]/.test(identifier)) {
        out += token('type', identifier);
      } else {
        out += escapeHtml(text);
      }
    }
  }
  return out + escapeHtml(code.slice(last));
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
  for (let i = start; i < code.length; i++) {
    const char = code[i];
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = '';
      }
    } else if (char === '\'' || char === '"' || char === '`') {
      quote = char;
    } else if (char === open) {
      depth++;
    } else if (char === close && --depth === 0) {
      return i;
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
  let i = 0;
  let text = '';
  const flushText = (): void => {
    out += escapeHtml(text);
    text = '';
  };

  /**
   * Highlights a `(condition)` and the `{` opening a block, if present at the cursor.
   */
  const blockHeader = (): void => {
    const space = /^\s*/.exec(code.slice(i))![0];
    if (code[i + space.length] === '(') {
      const end = findClosing(code, i + space.length, '(', ')');
      out += escapeHtml(space) + token('punc', '(') + highlightTs(code.slice(i + space.length + 1, end)) + token('punc', code[end] ?? '');
      i = end + 1;
    }
    const after = /^\s*/.exec(code.slice(i))![0];
    if (code[i + after.length] === '{') {
      out += escapeHtml(after) + token('punc', '{');
      i += after.length + 1;
    }
  };

  /**
   * Highlights the tag starting at the cursor, up to its closing `>`.
   */
  const tag = (): void => {
    const name = /^<\/?\s*[^\s/>]*/.exec(code.slice(i))![0];
    out += token('punc', name.startsWith('</') ? '</' : '<') + token('tag', name.replace(/^<\/?/, ''));
    i += name.length;
    // Whether the next quoted value is the handler of an event binding
    let handler = false;
    while (i < code.length) {
      const rest = code.slice(i);
      let match: RegExpExecArray | null;
      if ((match = /^\s+/.exec(rest))) {
        out += escapeHtml(match[0]);
      } else if ((match = /^\/?>/.exec(rest))) {
        out += token('punc', match[0]);
        i += match[0].length;
        return;
      } else if ((match = /^(?:@@|\*)[\w-]+/.exec(rest))) {
        out += token('dir', match[0]);
      } else if ((match = CONTROL_FLOW_RE.exec(rest))) {
        out += token('ctl', match[0]);
        i += match[0].length;
        blockHeader();
        continue;
      } else if ((match = /^\([^\s()="'>/]+\)/.exec(rest))) {
        out += token('evt', match[0]);
        handler = true;
      } else if ((match = /^[()}]/.exec(rest))) {
        out += token('punc', match[0]);
      } else if ((match = /^=/.exec(rest))) {
        out += token('punc', '=');
      } else if ((match = /^"([^"]*)"?/.exec(rest))) {
        const value = match[1] ?? '';
        const closing = match[0].endsWith('"') && match[0].length > 1 ? '"' : '';
        if (handler) {
          out += token('punc', '"') + highlightTs(value) + token('punc', closing);
        } else if (value.trimStart().startsWith('{')) {
          const open = value.indexOf('{');
          const close = value.lastIndexOf('}');
          out += token('punc', '"') + escapeHtml(value.slice(0, open)) + token('interp', '{') + highlightTs(value.slice(open + 1, close < 0 ? value.length : close)) + token('interp', close < 0 ? '' : '}') + escapeHtml(close < 0 ? '' : value.slice(close + 1)) + token('punc', closing);
        } else {
          out += token('str', match[0]);
        }
        handler = false;
      } else if ((match = /^[^\s=>/()"{}]+/.exec(rest))) {
        out += token('attr', match[0]);
        handler = false;
      } else {
        match = /^./s.exec(rest)!;
        out += escapeHtml(match[0]);
      }
      i += match[0].length;
    }
  };

  while (i < code.length) {
    const rest = code.slice(i);
    let match: RegExpExecArray | null;
    if (rest.startsWith('<!--')) {
      flushText();
      const end = code.indexOf('-->', i);
      const stop = end < 0 ? code.length : end + 3;
      out += token('com', code.slice(i, stop));
      i = stop;
    } else if (/^<\/?[A-Za-z]/.test(rest)) {
      flushText();
      tag();
    } else if ((match = /^@import\b[^\n]*/.exec(rest))) {
      flushText();
      out += token('ctl', '@import') + highlightTs(match[0].slice('@import'.length));
      i += match[0].length;
    } else if ((match = CONTROL_FLOW_RE.exec(rest))) {
      flushText();
      out += token('ctl', match[0]);
      i += match[0].length;
      blockHeader();
    } else if (rest[0] === '{') {
      flushText();
      const end = findClosing(code, i, '{', '}');
      out += token('interp', '{') + highlightTs(code.slice(i + 1, end)) + token('interp', code[end] ?? '');
      i = end + 1;
    } else if (rest[0] === '}') {
      flushText();
      out += token('punc', '}');
      i++;
    } else {
      text += rest[0];
      i++;
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
  let i = 0;
  // Whether each open block contains rules (at-rules such as @media) or declarations
  const blocks: Array<'rules' | 'declarations'> = [];
  let pendingAtRule = '';
  while (i < code.length) {
    const rest = code.slice(i);
    const inDeclarations = blocks.at(-1) === 'declarations';
    let match: RegExpExecArray | null;
    if ((match = /^\/\*[\s\S]*?(?:\*\/|$)/.exec(rest))) {
      out += token('com', match[0]);
    } else if ((match = /^('(?:\\.|[^'\\])*'?|"(?:\\.|[^"\\])*"?)/.exec(rest))) {
      out += token('str', match[0]);
    } else if ((match = /^@[\w-]+/.exec(rest))) {
      pendingAtRule = match[0];
      out += token('kw', match[0]);
    } else if (rest[0] === '{') {
      match = /^\{/.exec(rest)!;
      blocks.push(pendingAtRule && !/^@(font-face|page|property|counter-style)$/.test(pendingAtRule) ? 'rules' : 'declarations');
      pendingAtRule = '';
      out += token('punc', '{');
    } else if (rest[0] === '}') {
      match = /^\}/.exec(rest)!;
      blocks.pop();
      out += token('punc', '}');
    } else if (!inDeclarations && !pendingAtRule && (match = /^[^{}@/'"]+/.exec(rest))) {
      const selector = match[0];
      const trimmed = selector.trim();
      out += trimmed ? escapeHtml(selector.slice(0, selector.indexOf(trimmed))) + token('sel', trimmed) + escapeHtml(selector.slice(selector.indexOf(trimmed) + trimmed.length)) : escapeHtml(selector);
    } else if (inDeclarations && (match = /^(--[\w-]+|-?[a-zA-Z][\w-]*)(?=\s*:)/.exec(rest)) && /(^|[;{]\s*)$/.test(out.replace(/<[^>]*>/g, '').slice(-200))) {
      out += token('prop', match[0]);
    } else if ((match = /^#[\da-fA-F]{3,8}\b|^-?\d*\.?\d+(?:%|[a-zA-Z]+)?/.exec(rest))) {
      out += token('num', match[0]);
    } else if ((match = /^!important\b/.exec(rest))) {
      out += token('kw', match[0]);
    } else if ((match = /^[\w-]+(?=\()/.exec(rest))) {
      out += token('fn', match[0]);
    } else {
      match = /^[\s\S][^{}@/'"#\d!\w-]*/.exec(rest)!;
      if (match[0].includes(';')) {
        pendingAtRule = '';
      }
      out += escapeHtml(match[0]);
    }
    i += match[0].length;
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
      return colon ? token('attr', string) + colon : token('str', string);
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
    return highlighted + (comment ? escapeHtml(comment[1]!) + token('com', comment[0].slice(comment[1]!.length)) : '');
  }).join('\n');
}

/**
 * Highlights code, producing HTML made of escaped text and `<span class="tok-*">` tokens.
 *
 * @param code - The code to highlight.
 * @param lang - The language of the code.
 * @returns The highlighted HTML, safe to assign to `innerHTML`.
 */
export function highlight(code: string, lang: CodeLang): string {
  switch (lang) {
    case 'ts':
      return highlightTs(code);
    case 'html':
      return highlightTemplate(code);
    case 'css':
      return highlightCss(code);
    case 'json':
      return highlightJson(code);
    case 'bash':
      return highlightBash(code);
    default:
      return escapeHtml(code);
  }
}
