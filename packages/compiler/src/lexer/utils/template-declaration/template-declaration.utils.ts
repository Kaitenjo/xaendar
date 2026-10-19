import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';

/**
 * Tells whether the next item of the opening tag being lexed is the declaration of a template: the tag is a
 * `<template>` that declares none yet, e.g. after `<template ` but not after `<template row() `.
 *
 * @param tokens - The tokens emitted so far.
 * @returns `true` if the opening tag is a `<template>` without a declaration.
 */
export function expectsTemplateDeclaration(tokens: readonly Token[]): boolean {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    switch (token.type) {
      case TokenType.TEMPLATE_DECLARATION:
        return false;

      case TokenType.TAG_OPEN_NAME:
        return token.parts[0] === 'template';
    }
  }

  return false;
}
