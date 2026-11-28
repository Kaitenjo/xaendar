// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { adoptStyleSheets } from './adopt-style-sheets.util';

describe('adoptStyleSheets', () => {
  it('adopts the stylesheets of the component first, keeping the others after them, never doubled', () => {
    const root = document.createElement('div').attachShadow({ mode: 'open' });
    const base = new CSSStyleSheet();
    const own = new CSSStyleSheet();
    const added = new CSSStyleSheet();

    adoptStyleSheets(root, [base, own]);
    expect(root.adoptedStyleSheets).toEqual([base, own]);

    root.adoptedStyleSheets = [added, ...root.adoptedStyleSheets];
    adoptStyleSheets(root, [base, own]);
    expect(root.adoptedStyleSheets).toEqual([base, own, added]);
  });
});
