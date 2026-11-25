import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output.type';
import type { ServerStyles } from '../../types/server-styles.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { addStyleRule, writeShadowStyles, writeStyleElement } = await import('./server-styles.util');

/**
 * The rule of an element, by its index.
 */
const rule = (index: number, block: string) => `:is([data-xd-style="${index}"],#a#b#c#d#e){${block}}`;

/**
 * The block of declarations a rule keeps of the text of a `style` attribute, `undefined` when it keeps none.
 */
function blockOf(text: string): string | undefined {
  const styles: ServerStyles = { blocks: null };
  return addStyleRule(styles, text) === undefined ? undefined : styles.blocks!.keys().next().value;
}

describe('server styles', () => {
  describe('addStyleRule', () => {
    it('adds a rule per block of declarations, the elements with the same declarations sharing it', () => {
      const styles: ServerStyles = { blocks: null };

      expect(addStyleRule(styles, 'color: red')).toBe(0);
      expect(addStyleRule(styles, 'width: 4px; --accent: blue !important')).toBe(1);
      expect(addStyleRule(styles, 'color:red;')).toBe(0);
      expect(Array.from(styles.blocks!)).toEqual([['color: red;', 0], ['width: 4px; --accent: blue !important;', 1]]);
    });

    it('adds no rule for a style without declarations', () => {
      const styles: ServerStyles = { blocks: null };

      expect(addStyleRule(styles, '')).toBeUndefined();
      expect(addStyleRule(styles, 'color: {red}')).toBeUndefined();
      expect(styles.blocks).toBeNull();
    });

    it('keeps the values staying inside their declaration, with their strings, functions, brackets and escapes', () => {
      expect(blockOf('background: url(a;b) no-repeat; content: "a;b}{/*" \'c\'; grid-area: [a] 1 / [b] 2; font-family: A\\ B; quotes: "\\"" "\\""; -webkit-x: 1; --Mixed_case-1: x')).toBe(
        'background: url(a;b) no-repeat; content: "a;b}{/*" \'c\'; grid-area: [a] 1 / [b] 2; font-family: A\\ B; quotes: "\\"" "\\""; -webkit-x: 1; --Mixed_case-1: x;'
      );
    });

    it('leaves out a declaration whose name is no property', () => {
      expect(blockOf('}p{color: red; color: blue')).toBe('color: blue;');
      expect(blockOf('9x: 1; a b: 2; --: 3')).toBeUndefined();
    });

    it('leaves out a value that could end the block of its rule, or take in what follows it', () => {
      const values = [
        'red} p {color: blue',
        'red{',
        'red /* comment',
        '"open',
        '\'open',
        '"a\nb"',
        'url(a',
        'var(--x]',
        'a)',
        'a]',
        '[a',
        'red\\',
        'red\\\n',
        // An escaped quote opens no string in CSS, while the parser of the attribute reads one, keeping the ;
        'a\\"; b"'
      ];
      for (let i = 0; i < values.length; i++) {
        expect(blockOf(`color: ${values[i]}`), values[i]).toBeUndefined();
      }

      expect(blockOf('color: red}; width: 1px')).toBe('width: 1px;');
    });

    it('keeps a slash that opens no comment', () => {
      expect(blockOf('grid-row: 1 / 3')).toBe('grid-row: 1 / 3;');
    });
  });

  describe('writeStyleElement', () => {
    it('writes the rules of a tree into a <style> with the nonce, escaped, and the end of the element neutralized', () => {
      const styles: ServerStyles = { blocks: null };
      addStyleRule(styles, 'color: red');
      addStyleRule(styles, 'content: "</style>"');

      expect(writeStyleElement(styles, 'a"b')).toBe(`<style data-xd-style="" nonce="a&quot;b">${rule(0, 'color: red;')}${rule(1, 'content: "<\\/style>";')}</style>`);
      expect(writeStyleElement(styles, undefined).startsWith('<style data-xd-style="">')).toBe(true);
    });

    it('writes nothing for a tree without inline styles', () => {
      expect(writeStyleElement({ blocks: null }, 'n')).toBe('');
      expect(writeStyleElement({ blocks: new Map() }, 'n')).toBe('');
    });
  });

  describe('writeShadowStyles', () => {
    it('writes the <style> at once when no part of the content is pending', () => {
      const styles: ServerStyles = { blocks: null };
      addStyleRule(styles, 'color: red');

      expect(writeShadowStyles(['<p data-xd-style="0"></p>'], styles, undefined)).toBe(`<style data-xd-style="">${rule(0, 'color: red;')}</style>`);
    });

    it('writes the promise of the <style> while a part is pending, with the rules its parts add, nested ones included', async () => {
      const styles: ServerStyles = { blocks: null };
      let resolveInner!: (output: ServerOutput) => void;
      const inner = new Promise<ServerOutput>(resolve => resolveInner = resolve);
      const content: ServerOutput = ['<i></i>', Promise.resolve(['<b></b>', inner])];

      const written = writeShadowStyles(content, styles, 'n') as Promise<ServerOutput>;
      addStyleRule(styles, 'gap: 1px');
      await Promise.resolve();
      addStyleRule(styles, 'color: red');
      resolveInner(['<u data-xd-style="1"></u>']);

      expect(await written).toEqual([`<style data-xd-style="" nonce="n">${rule(0, 'gap: 1px;')}${rule(1, 'color: red;')}</style>`]);
    });
  });
});
