import { describe, expect, it } from 'vitest';
import { SAFE_HTML, trustHtml } from './trust-html.utils';

describe('trustHtml', () => {
  it('marks an HTML as trusted, under the symbol of the package only', () => {
    const trusted = trustHtml('<b onclick="go()">a</b>');

    expect(trusted[SAFE_HTML]).toBe('<b onclick="go()">a</b>');
    expect(Object.keys(trusted)).toEqual([]);
    expect(JSON.stringify(trusted)).toBe('{}');
  });
});
