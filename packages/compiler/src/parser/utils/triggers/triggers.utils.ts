import { isIdentifier, isObjectLiteralExpression } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { DeferNode } from '../../types/nodes/defer-node.type';
import type { HydrateNode } from '../../types/nodes/hydrate-node.type';
import type { DeferTrigger } from '../../types/triggers/defer-trigger.type';
import type { ElementTrigger } from '../../types/triggers/element-trigger.type';
import type { HydrateTrigger } from '../../types/triggers/hydrate-trigger.type';
import type { TriggerArgument } from '../../types/triggers/trigger-argument.type';
import type { TriggerOptions } from '../../types/triggers/trigger-options.type';
import type { TriggerTarget } from '../../types/triggers/trigger-target.type';
import type { VisibleTrigger } from '../../types/triggers/visible-trigger.type';
import { parseDuration } from '../durations/durations.utils';
import { validateExpression } from '../expression-validator/expression-validator';
import { splitTopLevel } from '../split-top-level/split-top-level.utils';

/**
 * The triggers of a `@defer` named by a keyword, followed by their arguments between parentheses when they take any.
 */
export const DEFER_TRIGGER_KEYWORDS: ReadonlyArray<Exclude<DeferTrigger['kind'], 'when'>> = ['load', 'idle', 'timer', 'visible', 'interaction', 'hover'];

/**
 * The triggers of a `@hydrate` named by a keyword: the ones of a `@defer`, and `never`, which a `@defer` does not take,
 * since a `@defer` that never renders its content would be its `@placeholder`.
 */
export const HYDRATE_TRIGGER_KEYWORDS: ReadonlyArray<Exclude<HydrateTrigger['kind'], 'when'>> = ['load', 'idle', 'timer', 'visible', 'interaction', 'hover', 'never'];

/**
 * The keyword marking a trigger that loads the modules of the content without rendering it.
 */
const PREFETCH = /^prefetch\b\s*/;

/**
 * The keyword of the trigger reading an expression, followed by the expression.
 */
const WHEN = /^when\s+/;

/**
 * A trigger written as a keyword, followed by its arguments between parentheses, if any.
 */
const KEYWORD_TRIGGER = /^([a-z]+)\s*(?:\(([\s\S]*)\))?$/;

/**
 * The name of an element ref.
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Parses the triggers of a `@hydrate`, written between its parentheses and separated by commas: the ones of a `@defer`
 * (see {@link parseDeferTriggers}), watching the elements of the content the server rendered, so without an element ref,
 * and `never`, which stands alone, since any other trigger would hydrate the content.
 *
 * @example
 * parseHydrateTriggers('visible, when ready()', 10); // { triggers: [{ kind: 'visible', … }, { kind: 'when', expression: 'ready()', … }], prefetch: [] }
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @returns The triggers hydrating the content and the ones loading its modules, in the order they are written.
 * @throws When there is no trigger, a trigger is unknown, declared twice or written with arguments it does not take,
 *   `never` is not alone, or an expression is not valid.
 */
export function parseHydrateTriggers(source: string, offset: number): Pick<HydrateNode, 'triggers' | 'prefetch'> {
  const parsed = parseTriggers(source, offset, '@hydrate');
  const never = parsed.triggers.find(({ kind }) => kind === 'never');
  if (never && (parsed.triggers.length > 1 || parsed.prefetch.length)) {
    throw new Error('The trigger "never" stands alone: any other trigger would hydrate the content', { cause: never.span });
  }

  return parsed;
}

/**
 * Parses the triggers of a `@defer`, written between its parentheses and separated by commas: `load`, `idle`, with the
 * longest time to wait (`idle(500ms)`), `timer` with a time (`timer(2s)`), `visible`, `interaction` and `hover`, each
 * one with the element ref of the element to watch (`hover(more)`), `visible` with the options of its observer too
 * (`visible(more, { rootMargin: '200px' })`), and `when` followed by an expression. A trigger written after `prefetch`
 * loads the modules of the content without rendering it. A comma inside an argument or an expression, in a call or a
 * literal, separates nothing.
 *
 * @example
 * parseDeferTriggers('hover(more), prefetch idle', 8); // { triggers: [{ kind: 'hover', target: { name: 'more', … }, … }], prefetch: [{ kind: 'idle', … }] }
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @returns The triggers rendering the content and the ones loading its modules, in the order they are written.
 * @throws When there is no trigger, a trigger is unknown, declared twice or written with arguments it does not take, or
 *   an argument or an expression is not valid.
 */
export function parseDeferTriggers(source: string, offset: number): Pick<DeferNode, 'triggers' | 'prefetch'> {
  return parseTriggers(source, offset, '@defer') as Pick<DeferNode, 'triggers' | 'prefetch'>;
}

/**
 * Parses the triggers of a block, separated by commas, into the ones rendering its content and the ones following
 * `prefetch`.
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @param block - The keyword of the block.
 * @returns The triggers, in the order they are written.
 * @throws When there is no trigger, a trigger is unknown, declared twice or written with arguments it does not take,
 *   `never` follows `prefetch`, or an argument or an expression is not valid.
 */
function parseTriggers(source: string, offset: number, block: '@defer' | '@hydrate'): Pick<HydrateNode, 'triggers' | 'prefetch'> {
  const keywords: readonly string[] = block === '@defer' ? DEFER_TRIGGER_KEYWORDS : HYDRATE_TRIGGER_KEYWORDS;
  const accepted = `${keywords.join(', ')}, or when followed by an expression, each one after prefetch to load the modules only`;
  const triggers = new Array<HydrateTrigger>();
  const prefetch = new Array<DeferTrigger>();
  const parts = splitTopLevel(source);
  for (let i = 0; i < parts.length; i++) {
    const { text, start } = parts[i];
    const prefetching = PREFETCH.exec(text);
    const skipped = prefetching ? prefetching[0].length : 0;
    const triggerText = text.slice(skipped);
    const span = { start: offset + start + skipped, end: offset + start + text.length };
    if (!triggerText) {
      throw new Error(`${block} needs a trigger${prefetching ? ' after prefetch' : ''}: use ${accepted}`, { cause: { start: offset + start, end: span.end } });
    }

    const trigger = parseTrigger(triggerText, span, block, keywords, accepted);
    if (prefetching && trigger.kind === 'never') {
      throw new Error('The trigger "never" loads nothing: it cannot follow prefetch', { cause: span });
    }

    const list: HydrateTrigger[] = prefetching ? prefetch : triggers;
    if (list.some(({ kind }) => kind === trigger.kind)) {
      throw new Error(`The trigger "${prefetching ? 'prefetch ' : ''}${trigger.kind}" is declared twice`, { cause: span });
    }

    list.push(trigger);
  }

  return { triggers, prefetch };
}

/**
 * Parses a trigger: a keyword, followed by its arguments between parentheses, or `when` followed by an expression.
 *
 * @param text - The trigger, as written, without `prefetch`.
 * @param span - Where the trigger is written.
 * @param block - The keyword of the block.
 * @param keywords - The triggers named by a keyword the block accepts.
 * @param accepted - The triggers the block accepts, named by the errors.
 * @returns The trigger.
 * @throws When the trigger is unknown or written with arguments it does not take, or an argument or the expression is
 *   not valid.
 */
function parseTrigger(text: string, span: Span, block: '@defer' | '@hydrate', keywords: readonly string[], accepted: string): HydrateTrigger {
  const when = WHEN.exec(text);
  if (when) {
    const expression = text.slice(when[0].length);
    return { kind: 'when', expression, expressionNode: validateExpression(expression, span.start + when[0].length).node, span };
  }

  const match = KEYWORD_TRIGGER.exec(text);
  const kind = match?.[1] as Exclude<HydrateTrigger['kind'], 'when'> | undefined;
  if (!kind || !keywords.includes(kind)) {
    throw new Error(`Unknown ${block} trigger "${text}": use ${accepted}`, { cause: span });
  }

  const args = match![2] === undefined ? undefined : toArguments(match![2], span.start + text.indexOf('(') + 1);
  switch (kind) {
    case 'idle':
      assertArguments(kind, args, 1, span);
      return args ? { kind, timeout: parseDuration(args[0].text, args[0].span), span } : { kind, span };

    case 'timer':
      if (!args) {
        throw new Error('The trigger "timer" needs a duration, such as timer(500ms)', { cause: span });
      }

      assertArguments(kind, args, 1, span);
      return { kind, delay: parseDuration(args[0].text, args[0].span), span };

    case 'visible': {
      assertArguments(kind, args, 2, span);
      const trigger: VisibleTrigger = { kind, span };
      // The options alone, or after the element ref
      const optionsIndex = args && (args.length > 1 || args[0].text.startsWith('{')) ? args.length - 1 : -1;
      if (args && optionsIndex !== 0) {
        trigger.target = parseTarget(args[0], block);
      }

      if (optionsIndex !== -1) {
        trigger.options = parseOptions(args![optionsIndex]);
      }

      return trigger;
    }

    case 'interaction':
    case 'hover': {
      assertArguments(kind, args, 1, span);
      const trigger: ElementTrigger = { kind, span };
      if (args) {
        trigger.target = parseTarget(args[0], block);
      }

      return trigger;
    }

    default:
      assertArguments(kind, args, 0, span);
      return { kind, span };
  }
}

/**
 * Splits the arguments of a trigger, written between its parentheses.
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @returns The arguments, an empty one for empty parentheses.
 */
function toArguments(source: string, offset: number): TriggerArgument[] {
  return splitTopLevel(source).map(({ text, start }) => ({ text, span: { start: offset + start, end: offset + start + text.length } }));
}

/**
 * Ensures a trigger is written with no more arguments than it takes.
 *
 * @param kind - The kind of the trigger.
 * @param args - The arguments, `undefined` without parentheses.
 * @param max - The number of arguments the trigger takes at most.
 * @param span - Where the trigger is written.
 * @throws When the trigger is written with more arguments.
 */
function assertArguments(kind: string, args: readonly TriggerArgument[] | undefined, max: number, span: Span): void {
  if (args && args.length > max) {
    throw new Error(`The trigger "${kind}" takes ${max ? `at most ${max === 1 ? 'one argument' : `${max} arguments`}` : 'no arguments'}`, { cause: span });
  }
}

/**
 * Parses the element ref naming the element a trigger of a `@defer` watches.
 *
 * @param argument - The argument.
 * @param block - The keyword of the block.
 * @returns The element ref.
 * @throws When the block is a `@hydrate`, which watches the elements of its content, or the argument is not a name.
 */
function parseTarget({ text, span }: TriggerArgument, block: '@defer' | '@hydrate'): TriggerTarget {
  if (block === '@hydrate') {
    throw new Error('A trigger of @hydrate watches the elements of its content: it takes no element ref', { cause: span });
  }

  const node = IDENTIFIER.test(text) ? validateExpression(text, span.start).node : undefined;
  if (!node || !isIdentifier(node)) {
    throw new Error(`Expected the element ref naming the element to watch, got "${text}"`, { cause: span });
  }

  return { name: text, expressionNode: node, span };
}

/**
 * Parses the options of the observer of a `visible` trigger, written as an object literal.
 *
 * @param argument - The argument.
 * @returns The options.
 * @throws When the argument is not an object literal.
 */
function parseOptions({ text, span }: TriggerArgument): TriggerOptions {
  const { node } = validateExpression(text, span.start);
  if (!isObjectLiteralExpression(node)) {
    throw new Error(`Expected the options of the observer as an object literal, such as { rootMargin: '200px' }, got "${text}"`, { cause: span });
  }

  return { expression: text, expressionNode: node, span };
}
