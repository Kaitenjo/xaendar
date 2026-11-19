import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import { checkServerBlocks } from './server-blocks.utils';

/**
 * Checks a template, returning for each error the text of the template it points to.
 */
const check = (template: string) => checkServerBlocks(parseTemplate(template)).map(error => {
  const { start, end } = error.cause as { start: number, end: number };
  return template.slice(start, end);
});

describe('checkServerBlocks', () => {
  it.each([
    ['@hydrate', '@hydrate (idle) { <b></b> }'],
    ['@client', '<p></p>\n@client { <b></b> }']
  ])('rejects a %s, on its keyword, telling what to do', (keyword, template) => {
    const [error] = checkServerBlocks(parseTemplate(template));

    expect(error.message).toBe(`${keyword} is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the block`);
    expect(check(template)).toEqual([keyword]);
  });

  it('reports every block, wherever it is, in the order of the template', () => {
    expect(check('<p>@hydrate (never) { @if (a) { @client { <b></b> } } }</p> @client { }')).toEqual(['@hydrate', '@client', '@client']);
  });

  it('accepts a template without those blocks', () => {
    expect(check('<p>{ a }</p> @if (a) { <b></b> }')).toEqual([]);
  });
});
