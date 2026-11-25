import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { addInlineHashes, writeContentSecurityPolicy } from './content-security-policy.utils';

/**
 * The source allowing an inline element by the hash of its text.
 */
const sha = (text: string) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

describe('content security policy', () => {
  describe('addInlineHashes', () => {
    it('adds the hashes of the inline scripts and of every style, shadow roots included, once each', () => {
      const html = '<style>p{}</style><x-a><template shadowrootmode="open"><style nonce="n">p{}</style><style data-xd-style="">b{}</style></template></x-a><script>run()</script><script type="module" src="/a.js"></script><SCRIPT>run()</SCRIPT >';

      expect(addInlineHashes('default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\';', html)).toBe(
        `default-src 'self'; script-src 'self' 'unsafe-inline' ${sha('run()')}; style-src 'self' ${sha('p{}')} ${sha('b{}')}`
      );
    });

    it('adds a missing directive with the sources of default-src, or self', () => {
      const html = '<style>p{}</style><script>run()</script>';

      expect(addInlineHashes('DEFAULT-SRC https://a.test', html)).toBe(`DEFAULT-SRC https://a.test; script-src https://a.test ${sha('run()')}; style-src https://a.test ${sha('p{}')}`);
      expect(addInlineHashes('object-src \'none\'', html)).toBe(`object-src 'none'; script-src 'self' ${sha('run()')}; style-src 'self' ${sha('p{}')}`);
      expect(addInlineHashes('default-src', html)).toBe(`default-src; script-src 'self' ${sha('run()')}; style-src 'self' ${sha('p{}')}`);
    });

    it('leaves the policy as it is for a page without inline elements', () => {
      expect(addInlineHashes('default-src \'self\'', '<script src="/a.js"></script><p></p>')).toBe('default-src \'self\'');
    });
  });

  describe('writeContentSecurityPolicy', () => {
    it('writes the policy first in the head, escaped', () => {
      expect(writeContentSecurityPolicy('<html><head lang="x"><title></title></head><body><style>p{}</style></body></html>', 'default-src "a" &')).toBe(
        `<html><head lang="x"><meta http-equiv="Content-Security-Policy" content="default-src &quot;a&quot; &amp;; style-src &quot;a&quot; &amp; ${sha('p{}')}"><title></title></head><body><style>p{}</style></body></html>`
      );
    });

    it('writes the policy first in a page without head', () => {
      expect(writeContentSecurityPolicy('<body></body>', 'default-src \'self\'')).toBe('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'"><body></body>');
    });
  });
});
