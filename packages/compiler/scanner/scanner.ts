import { existsSync, readFile, rmSync, writeFile } from "fs";
import { Token } from "../models/token.type";
import { FORMERR } from "dns";
import { CLOSE_INTERPOLATION, OPEN_INTERPOLATION } from "../token.costants";

export function tokenize(input: string) {
  const tokens = new Array<Token>();
  const len = input.length;
  let i = 0;

  while (i < len) {
    let handled = false;

    for (const scanner of [scanInterpolation]) {
      const result = scanner(input, i);
      if (result.handled) {
        tokens.push(...result.tokens);
        i = result.nextIndex;
        handled = true;
        break;
      }
    }

    if (!handled) {
      i++;
    }
  }

  return tokens;
}

function scanInterpolation(input: string, i: number): { handled: boolean, tokens: Token[], nextIndex: number } {
  // If the current position does not start with '{{', this is not an interpolation.
  if (input.slice(i, i + 1) !== OPEN_INTERPOLATION) {
    return { handled: false, tokens: [], nextIndex: i };
  }

  let j = i;
  let foundClosing = false;

  while (j < input.length) {
    if (input.slice(j, j + 1) === CLOSE_INTERPOLATION) {
      foundClosing = true;
      break;
    }

    j += 2;
  }

  if (!foundClosing) {
    throw new Error(`Unclosed interpolation expression\n-->   ${input.slice(i, i + 10)} at location ${i}`);
  }

  return {
    handled: true,
    tokens: [{ type: 'INTERPOLATION', value: input.slice(i + 2, j - 3).trim() }],
    nextIndex: j
  };
}

function scanDirective(input: string, i: number): { handled: boolean, tokens: Token[], nextIndex: number } {
  if (input[i] !== '@') {
    return { handled: false, tokens: [], nextIndex: i };
  }

  let j = i + 1;
  const len = input.length;

  while (j < len) {
    if (!/[a-zA-Z]/.test(input[j])) {
      break;
    }
    j++;
  }

  const value = input.slice(i + 1, j);
  return {
    handled: true,
    tokens: [{ type: 'DIRECTIVE', value }],
    nextIndex: j
  };
}

function scanTag(input: string, i: number): { handled: boolean, tokens: Token[], nextIndex: number } {
  if (input[i] !== '<') {
    return { handled: false, tokens: [], nextIndex: i };
  }
  const len = input.length;
  let j = i + 1;
  let inQuote: string | null = null;
  let done = false;
  while (j < len && !done) {
    const c = input[j];
    if (!inQuote && (c === '"' || c === "'")) {
      inQuote = c;
    } else if (inQuote === c) {
      inQuote = null;
    } else if (!inQuote && c === '>') {
      done = true;
    }
    j++;
  }
  return {
    handled: true,
    tokens: [{ type: 'TAG', value: input.slice(i, j) }],
    nextIndex: j
  };
}

function scanText(input: string, i: number): { handled: boolean, tokens: Token[], nextIndex: number } {
  const len = input.length;
  let j = i;
  let done = false;
  while (j < len && !done) {
    if (input[j] === '{' || input[j] === '$' || input[j] === '<') {
      done = true;
    } else {
      j++;
    }
  }
  const text = input.slice(i, j);
  if (!text) {
    return { handled: false, tokens: [], nextIndex: i };
  }
  return {
    handled: true,
    tokens: [{ type: 'TEXT', value: text }],
    nextIndex: j
  };
}

const code = `
{{label
`

const path = './temp.json'

if (existsSync(path)) {
  rmSync(path);
}

writeFile(path, JSON.stringify(tokenize(code)), () => { });