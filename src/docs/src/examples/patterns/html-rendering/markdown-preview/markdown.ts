/**
 * Escapes the characters that have a meaning in HTML.
 *
 * @param text - Plain text.
 * @returns The text, safe to put in HTML.
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Applies the inline formatting: `code`, **bold** and *italic*.
 *
 * @param text - Escaped text.
 * @returns The formatted HTML.
 */
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Turns a tiny subset of Markdown into HTML: headings, lists, paragraphs and inline formatting.
 * Everything is escaped first, so the source cannot inject markup.
 *
 * @param source - The Markdown source.
 * @returns The HTML.
 */
export function renderMarkdown(source: string): string {
  return escapeHtml(source)
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(block => block.length > 0)
    .map(block => {
      if (block.startsWith('# ')) {
        return `<h4>${inline(block.slice(2))}</h4>`;
      }
      const lines = block.split('\n');
      if (lines.every(line => line.startsWith('- '))) {
        return `<ul>${lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
      }
      return `<p>${inline(lines.join(' '))}</p>`;
    })
    .join('\n');
}
