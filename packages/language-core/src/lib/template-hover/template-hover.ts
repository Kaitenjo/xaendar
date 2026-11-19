import { resolveShimPosition } from '@xaendar/compiler';
import { displayPartsToString, type QuickInfo } from 'typescript';
import type { TemplateAnalysis } from '../types/template-analysis.type';
import { findDefinitionTarget } from '../template-definition/template-definition';
import type { DefinitionTarget } from '../types/definition-target.type';
import { toTemplateSpan } from '../utils/template-span/template-span.utils';
import type { TemplateHover } from '../types/template-hover.type';

/**
 * Finds what to show on the part of a template at an offset:
 * - the tag name of a component, the selector of a directive: the signature and the JSDoc of its class;
 * - an attribute or an event bound to a component or directive: the ones of its `@Property` or `@Event` accessor;
 * - an identifier of an expression or the handler of an event: what TypeScript knows about it.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The hover, `undefined` if there is nothing to show at the offset.
 */
export function getTemplateHover(analysis: TemplateAnalysis, offset: number): TemplateHover | undefined {
  const target = findDefinitionTarget(analysis, offset);
  return target ? getDeclarationHover(analysis, target) : getTypeScriptHover(analysis, offset);
}

/**
 * Reads the hover of a part of a template from the declaration it leads to.
 *
 * @param analysis - The analysis of the template.
 * @param target - The part of the template.
 * @returns The hover, `undefined` if the part leads to a whole file (the path of an `@import`) or the declaration is unknown to TypeScript.
 */
function getDeclarationHover({ languageService }: TemplateAnalysis, { span, definitions }: DefinitionTarget): TemplateHover | undefined {
  const { fileName, span: declaration } = definitions[0];
  const contents = declaration.end > declaration.start ? toMarkdown(languageService.getQuickInfoAtPosition(fileName, declaration.start)) : undefined;
  return contents ? { contents, span } : undefined;
}

/**
 * Asks TypeScript what the identifier of the shim the offset of the template is mapped onto is.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The hover, `undefined` if the offset is not on a symbol.
 */
function getTypeScriptHover({ typeCheck, languageService, shimPath, bodyLineOffset }: TemplateAnalysis, offset: number): TemplateHover | undefined {
  const shimPosition = resolveShimPosition(typeCheck.mappingTable, offset);
  const shimFile = languageService.getProgram()?.getSourceFile(shimPath);
  if (!shimPosition || !shimFile) {
    return undefined;
  }

  const position = shimFile.getPositionOfLineAndCharacter(shimPosition.line + bodyLineOffset, shimPosition.character);
  const quickInfo = languageService.getQuickInfoAtPosition(shimPath, position);
  const contents = toMarkdown(quickInfo);
  const span = quickInfo && toTemplateSpan(typeCheck, shimFile, bodyLineOffset, quickInfo.textSpan.start, quickInfo.textSpan.length);
  return contents && span ? { contents, span } : undefined;
}

/**
 * Writes what TypeScript knows about a symbol in markdown.
 *
 * @param quickInfo - The quick info of the symbol.
 * @returns The signature in a code block, then the documentation and the tags (`@param`, `@returns`…) of its JSDoc, `undefined` if there is no quick info.
 */
function toMarkdown(quickInfo: QuickInfo | undefined): string | undefined {
  if (!quickInfo) {
    return undefined;
  }

  const sections = [`\`\`\`ts\n${displayPartsToString(quickInfo.displayParts)}\n\`\`\``];
  const documentation = displayPartsToString(quickInfo.documentation);
  if (documentation) {
    sections.push(documentation);
  }

  const { tags } = quickInfo;
  if (tags?.length) {
    for (let i = 0; i < tags.length; i++) {
      const { name, text } = tags[i];
      const description = displayPartsToString(text);
      sections.push(description ? `*@${name}* — ${description}` : `*@${name}*`);
    }
  }

  return sections.join('\n\n');
}
