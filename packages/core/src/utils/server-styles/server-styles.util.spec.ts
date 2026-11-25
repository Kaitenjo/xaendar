// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { adoptHostServerStyle, adoptServerStyles } from './server-styles.util';

/**
 * The `<style>` the server writes for the inline styles of the elements of a tree, one rule per declaration block.
 */
function serverStyle(...blocks: string[]): string {
  return `<style data-xd-style="">${blocks.map((block, index) => `:is([data-xd-style="${index}"],#a#b#c#d#e){${block}}`).join('')}</style>`;
}

/**
 * A shadow root in the document, holding the HTML of the server.
 */
function shadowRoot(html: string): ShadowRoot {
  const root = document.body.appendChild(document.createElement('div')).attachShadow({ mode: 'open' });
  root.innerHTML = html;
  return root;
}

describe('server styles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('adoptServerStyles', () => {
    it('moves the declarations of the rule of each element of the root into its inline style, removing its attribute, the <style> left as it is', () => {
      const root = shadowRoot(`${serverStyle('color: red; --accent: blue !important;', 'width: 4px;')}<p data-xd-style="1"><i data-xd-style="0"></i></p><b data-xd-style="0"></b>`);

      adoptServerStyles(root, root.firstChild as HTMLStyleElement);

      expect(root.querySelector('i')!.getAttribute('style')).toBe('color: red; --accent: blue !important;');
      expect(root.querySelector('b')!.getAttribute('style')).toBe('color: red; --accent: blue !important;');
      expect(root.querySelector('p')!.getAttribute('style')).toBe('width: 4px;');
      expect(root.querySelectorAll('[data-xd-style]')).toHaveLength(1);
    });

    it('only removes the attribute of an element whose rule is missing or declares nothing', () => {
      const root = shadowRoot(`${serverStyle('')}<p data-xd-style="0"></p><i data-xd-style="7"></i><b data-xd-style="x"></b>`);

      adoptServerStyles(root, root.firstChild as HTMLStyleElement);

      expect(root.innerHTML.endsWith('<p></p><i></i><b></b>')).toBe(true);
    });

    it('only removes the attributes when the browser applied no stylesheet, as when a Content-Security-Policy blocked it', () => {
      const root = shadowRoot('<p data-xd-style="0"></p>');
      const style = document.createElement('style');

      adoptServerStyles(root, style);

      expect(root.innerHTML).toBe('<p></p>');
    });
  });

  describe('adoptHostServerStyle', () => {
    it('moves the declarations of the rule of the root of a page from the <style> right before it', () => {
      document.body.innerHTML = `<style>p{}</style>${serverStyle('display: grid;')}<x-root data-xd-style="0"></x-root>`;
      const element = document.body.lastElementChild!;

      adoptHostServerStyle(element);

      expect(element.outerHTML).toBe('<x-root style="display: grid;"></x-root>');
    });

    it('moves the declarations of the rule of a component a static one renders from the <style> of its shadow root, after the stylesheet', () => {
      const root = shadowRoot(`<style>p{}</style>${serverStyle('gap: 2px;')}<x-island data-xd-style="0"></x-island>`);
      const element = root.lastElementChild!;

      adoptHostServerStyle(element);

      expect(element.outerHTML).toBe('<x-island style="gap: 2px;"></x-island>');
    });

    it('only removes the attribute when no <style> of the server is found', () => {
      document.body.innerHTML = '<style>p{}</style><x-root data-xd-style="0"></x-root>';
      const root = shadowRoot('<style>p{}</style><x-island data-xd-style="0"></x-island>');
      const empty = shadowRoot('<x-island data-xd-style="0"></x-island>');
      const first = document.body.firstElementChild!.nextElementSibling!;

      adoptHostServerStyle(first);
      adoptHostServerStyle(root.lastElementChild!);
      adoptHostServerStyle(empty.firstElementChild!);

      expect(first.outerHTML).toBe('<x-root></x-root>');
      expect(root.innerHTML).toBe('<style>p{}</style><x-island></x-island>');
      expect(empty.innerHTML).toBe('<x-island></x-island>');
    });

    it('leaves an element without the attribute as it is', () => {
      document.body.innerHTML = `${serverStyle('color: red;')}<x-root style="gap: 1px;"></x-root>`;
      const element = document.body.lastElementChild!;

      adoptHostServerStyle(element);

      expect(element.getAttribute('style')).toBe('gap: 1px;');
    });
  });
});
