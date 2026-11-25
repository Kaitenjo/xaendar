import { createHash } from 'node:crypto';

/**
 * The inline `<script>` and `<style>` elements of a page: the name of the element, its attributes and its text.
 */
const INLINE_ELEMENT = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;

/**
 * An attribute `src`, which makes a `<script>` load its code instead of running its text.
 */
const SOURCE_ATTRIBUTE = /(?:^|\s)src\s*=/i;

/**
 * The `<head>` start tag of a page, the policy going right after it.
 */
const HEAD_START = /<head\b[^>]*>/i;

/**
 * Writes the `Content-Security-Policy` of a project into a prerendered page, as a
 * `<meta http-equiv="Content-Security-Policy">` first in its `<head>` (or first in the page without one), so that it
 * covers every element after it. The policy is the project's, extended by the hashes of the inline elements of the
 * page: `script-src` with the `'sha256-…'` of each inline `<script>` (the ones without `src`), `style-src` with the one
 * of each `<style>`, shadow roots included. A page thus needs no `'unsafe-inline'`, and no nonce, which a static file,
 * the same for every request, cannot carry. A directive the policy lacks is added with the sources of `default-src`,
 * or `'self'`, before the hashes; a page without inline elements of a kind leaves its directive as it is.
 *
 * @param html The prerendered page.
 * @param policy The `Content-Security-Policy` of the project.
 * @returns The page with its policy.
 */
export function writeContentSecurityPolicy(html: string, policy: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(addInlineHashes(policy, html))}">`;
  const head = HEAD_START.exec(html);
  return head ? `${html.slice(0, head.index + head[0].length)}${meta}${html.slice(head.index + head[0].length)}` : `${meta}${html}`;
}

/**
 * Adds to a policy the hashes of the inline `<script>` and `<style>` elements of a page (see
 * {@link writeContentSecurityPolicy}).
 *
 * @param policy The `Content-Security-Policy` of the project.
 * @param html The page.
 * @returns The policy allowing the inline elements of the page.
 */
export function addInlineHashes(policy: string, html: string): string {
  const scripts = new Set<string>();
  const styles = new Set<string>();
  for (const [, name, attributes, text] of html.matchAll(INLINE_ELEMENT)) {
    if (name.toLowerCase() === 'style') {
      styles.add(hash(text));
    } else if (!SOURCE_ATTRIBUTE.test(attributes)) {
      scripts.add(hash(text));
    }
  }

  const directives = policy.split(';').map(directive => directive.trim()).filter(directive => directive);
  addSources(directives, 'script-src', scripts);
  addSources(directives, 'style-src', styles);
  return directives.join('; ');
}

/**
 * Adds hashes to a directive of a policy, adding the directive when the policy lacks it.
 *
 * @param directives The directives of the policy, changed in place.
 * @param name The name of the directive.
 * @param hashes The hashes to allow.
 */
function addSources(directives: string[], name: string, hashes: Set<string>): void {
  if (!hashes.size) {
    return;
  }

  const sources = Array.from(hashes, value => `'sha256-${value}'`).join(' ');
  const index = directives.findIndex(directive => nameOf(directive) === name);
  if (index === -1) {
    const fallback = directives.find(directive => nameOf(directive) === 'default-src');
    const base = fallback?.slice('default-src'.length).trim() || '\'self\'';
    directives.push(`${name} ${base} ${sources}`);
  } else {
    directives[index] = `${directives[index]} ${sources}`;
  }
}

/**
 * The name of a directive, lowercase.
 *
 * @param directive The directive, with its sources.
 * @returns Its name.
 */
function nameOf(directive: string): string {
  return directive.split(/\s/, 1)[0].toLowerCase();
}

/**
 * The base64 `sha256` of the text of an element, as a policy names it.
 *
 * @param text The text of the element.
 * @returns Its hash.
 */
function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('base64');
}

/**
 * Escapes a value written in a double-quoted attribute.
 *
 * @param value The value.
 * @returns The escaped value.
 */
function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
