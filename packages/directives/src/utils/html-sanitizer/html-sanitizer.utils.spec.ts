// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { HtmlSanitizerOptions } from '../../types/html-sanitizer-options.type';
import { sanitizeHtml, sanitizeHtmlWithReport } from './html-sanitizer.utils';

/**
 * Loads the sanitizer again, with the security of the project the plugin defines.
 */
async function loadWith(security: object): Promise<typeof import('./html-sanitizer.utils')> {
  vi.stubGlobal('__XAENDAR_SECURITY__', security);
  vi.resetModules();
  try {
    return await import('./html-sanitizer.utils');
  } finally {
    vi.unstubAllGlobals();
  }
}

/**
 * Inputs written to run code in a page, from the cheat sheets of XSS and of mutation XSS.
 */
const attacks = [
  '<script>alert(1)</script>',
  '<SCRIPT SRC=//evil/x.js></SCRIPT>',
  '<img src=x onerror=alert(1)>',
  '<img src="x" ONERROR="alert(1)">',
  '<img/src=x/onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  '<svg><style><img src=x onerror=alert(1)></style></svg>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href="  JaVaScRiPt:alert(1)">x</a>',
  '<a href="java&#x09;script:alert(1)">x</a>',
  '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">x</a>',
  '<a href="&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058alert(1)">x</a>',
  '<a href="javascript&colon;alert(1)">x</a>',
  '<a href="vbscript:msgbox(1)">x</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  '<img srcset="a.png 1x, javascript:alert(1) 2x">',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<object data="javascript:alert(1)"></object>',
  '<embed src="javascript:alert(1)">',
  '<form action="javascript:alert(1)"><button>x</button></form>',
  '<button formaction="javascript:alert(1)">x</button>',
  '<details open ontoggle=alert(1)>',
  '<video><source onerror=alert(1)></video>',
  '<body onload=alert(1)>',
  '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  '<base href="javascript:alert(1)//">',
  '<link rel="import" href="//evil/x.html">',
  '<div style="background:url(javascript:alert(1))">',
  '<!--<img src="--><img src=x onerror=alert(1)//">',
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  '<xmp><p title="</xmp><img src=x onerror=alert(1)>">',
  '<textarea></textarea><img src=x onerror=alert(1)></textarea>',
  '<template><script>alert(1)</script></template>',
  '<p title="a" title="b" onclick="alert(1)">x</p>',
  '<a href=x onmouseover=alert(1) =x>x</a>',
  '<img src=x onerror=alert(1)//',
  '<img src="x"onerror="alert(1)">',
  '"><script>alert(1)</script>',
  '</div><script>alert(1)</script>',
  '<p id="cookie" name="location">x</p>'
];

/**
 * Parses an HTML in an element, as the browser parses the content of the element `@@innerHtml` fills.
 */
function parse(html: string): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element;
}

/**
 * Tells whether a parsed HTML holds a script, an attribute running code, or a URL that does not start with an allowed
 * scheme.
 */
function runsCode(element: HTMLElement): boolean {
  const elements = element.querySelectorAll('*');
  for (let i = 0; i < elements.length; i++) {
    const current = elements[i];
    if (['script', 'iframe', 'object', 'embed', 'form', 'base', 'meta', 'link', 'style', 'svg', 'math'].includes(current.localName)) {
      return true;
    }

    for (let j = 0; j < current.attributes.length; j++) {
      const { name, value } = current.attributes[j];
      if (name.startsWith('on') || name === 'style' || name === 'id' || name === 'name' || /^\W*(javascript|vbscript|data:text)/i.test(value)) {
        return true;
      }
    }
  }

  return false;
}

describe('sanitizeHtml', () => {
  it('lets no attack through', () => {
    for (let i = 0; i < attacks.length; i++) {
      const sanitized = sanitizeHtml(attacks[i]);

      expect(runsCode(parse(sanitized)), `${attacks[i]} -> ${sanitized}`).toBe(false);
      // What it writes is read back as it is written
      expect(sanitizeHtml(sanitized), attacks[i]).toBe(sanitized);
    }
  });

  it('keeps by default the elements and the attributes Angular keeps, and the aria-* attributes', () => {
    const text = '<h2 title="t">Title</h2><p class="lead" lang="en">A <a href="https://x" target="_blank" rel="noopener">link</a>, <code>code</code> and <img src="/a.png" alt="a" width="10" srcset="/a.png 1x, /b.png 2x"></p>';
    const blocks = '<ul><li aria-label="one">1</li></ul><table><tbody><tr><td colspan="2">c</td></tr></tbody></table><video controls="" poster="/p.png"><source src="/v.mp4" type="video/mp4"></video>';
    const html = `${text}${blocks}`;

    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes by default the forms, the SVG, the custom elements, id, name, style and data-*', () => {
    expect(sanitizeHtml('<form><input name="q"><button>Go</button></form><svg><circle r="1"/></svg><x-card id="a" style="color:red" data-id="1">c</x-card>')).toBe('Goc');
  });

  it('keeps the elements and the attributes allowed by the options, by name or by prefix', () => {
    const options: HtmlSanitizerOptions = { allowElements: ['svg', 'path', 'x-*'], allowAttributes: ['viewBox', 'd', 'style', 'data-*'] };

    expect(sanitizeHtml('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg><x-card data-id="1" style="color:red">c</x-card>', options))
      .toBe('<svg viewbox="0 0 1 1"><path d="M0 0"></path></svg><x-card data-id="1" style="color:red">c</x-card>');
  });

  it('removes the elements and the attributes removed by the options, keeping the content of the elements', () => {
    const options: HtmlSanitizerOptions = { removeElements: ['a', 'h*'], removeAttributes: ['class', 'aria-*'] };

    expect(sanitizeHtml('<h1 class="x">T</h1><hr><a href="/x" aria-label="l">l</a><p class="y" aria-hidden="true">p</p>', options)).toBe('Tl<p>p</p>');
  });

  it('keeps, or removes, an attribute written element[attribute] on that element only', () => {
    const options: HtmlSanitizerOptions = { allowAttributes: ['span[style]'], removeAttributes: ['a[target]'] };

    expect(sanitizeHtmlWithReport('<span style="color:red">s</span><div style="position:fixed">d</div><a href="/x" target="_blank">a</a><area target="_blank">', options)).toEqual({
      html: '<span style="color:red">s</span><div>d</div><a href="/x">a</a><area target="_blank">',
      report: { removedElements: [], removedAttributes: ['div[style]', 'a[target]'] }
    });
  });

  it('keeps the URLs of the schemes given by the options only, in place of the default ones', () => {
    const options: HtmlSanitizerOptions = { urlSchemes: ['HTTPS', 'myapp'] };

    expect(sanitizeHtml('<a href="https://x">1</a><a href="http://x">2</a><a href="myapp://open">3</a><a href="/rel">4</a>', options))
      .toBe('<a href="https://x">1</a><a>2</a><a href="myapp://open">3</a><a href="/rel">4</a>');
  });

  it('reads the options once for each object', () => {
    const options = { allowAttributes: ['style'] };
    sanitizeHtml('', options);
    (options.allowAttributes as string[]).push('data-x');

    expect(sanitizeHtml('<p style="x" data-x="1">p</p>', options)).toBe('<p style="x">p</p>');
  });

  it.each([
    [{ allowElements: ['SCRIPT'] }, 'The allowElements of the sanitizer list SCRIPT, keeping <script>, whose code the browser runs once the page rendered on the server holds it: render a trusted HTML with trustHtml(), or with a sanitizer of the application, instead'],
    [{ allowElements: ['b*'] }, 'The allowElements of the sanitizer list b*, keeping <base>, which changes where every relative URL of the page leads'],
    [{ allowElements: ['meta'] }, 'keeping <meta>, which can send the page elsewhere'],
    [{ allowAttributes: ['onclick'] }, 'The allowAttributes of the sanitizer list onclick, keeping an attribute the browser runs (on*, srcdoc)'],
    [{ allowAttributes: ['img[onError]'] }, 'list img[onError], keeping an attribute'],
    [{ allowAttributes: ['o*'] }, 'list o*, keeping an attribute'],
    [{ allowAttributes: ['on-*'] }, 'list on-*, keeping an attribute'],
    [{ allowAttributes: ['iframe[srcdoc]'] }, 'list iframe[srcdoc], keeping an attribute'],
    [{ urlSchemes: ['https', 'JavaScript'] }, 'The urlSchemes of the sanitizer list JavaScript, a scheme running code']
  ])('rejects options keeping what always runs code: %j', (options: HtmlSanitizerOptions, message) => {
    expect(() => sanitizeHtml('', options)).toThrow(message);
  });

  it('accepts the options naming what only looks like what runs code', () => {
    expect(sanitizeHtml('<p data-on="1" no-onclick="2">p</p>', { allowElements: ['scripts', 'p*'], allowAttributes: ['data-*', 'no-onclick', 'srcset'], urlSchemes: ['data'] })).toBe('<p data-on="1" no-onclick="2">p</p>');
  });

  it('keeps the resources an element allowed loads from the application only, as the security of the project asks by default', () => {
    const options: HtmlSanitizerOptions = { allowElements: ['iframe', 'object'], allowAttributes: ['src', 'data'] };

    expect(sanitizeHtmlWithReport('<iframe src="/frame.html"></iframe><iframe src="https://evil.com/frame.html"></iframe><object data="//evil.com/x"></object><img src="https://example.com/a.png">', options)).toEqual({
      html: '<iframe src="/frame.html"></iframe><iframe></iframe><object></object><img src="https://example.com/a.png">',
      report: { removedElements: [], removedAttributes: ['iframe[src]', 'object[data]'] }
    });
  });

  it('keeps the resources of the trusted origins of the project, and every resource when it does not check them', async () => {
    const options: HtmlSanitizerOptions = { allowElements: ['iframe'], allowAttributes: ['src'] };
    const html = '<iframe src="https://cdn.example.com/a.html"></iframe><iframe src="https://evil.com/b.html"></iframe>';

    expect((await loadWith({ urls: 'remove', resourceUrls: 'remove', trustedOrigins: ['https://cdn.example.com'], rejectUnsafeBindings: true })).sanitizeHtml(html, options))
      .toBe('<iframe src="https://cdn.example.com/a.html"></iframe><iframe></iframe>');
    expect((await loadWith({ urls: 'remove', resourceUrls: 'off', trustedOrigins: [], rejectUnsafeBindings: true })).sanitizeHtml(html, options)).toBe(html);
  });

  it('applies the html of the security of the project to every use, adding the lists a use passes and taking its schemes', async () => {
    const html = { allowElements: ['iframe'], allowAttributes: ['src'], removeAttributes: ['a[target]'], urlSchemes: ['https'] };
    const { sanitizeHtml: sanitize } = await loadWith({ urls: 'remove', resourceUrls: 'off', trustedOrigins: [], rejectUnsafeBindings: true, html });
    const page = '<iframe src="/a.html"></iframe><a href="http://x" target="_blank" data-x="1">a</a>';

    expect(sanitize(page)).toBe('<iframe src="/a.html"></iframe><a>a</a>');
    expect(sanitize(page, { allowAttributes: ['data-x'], urlSchemes: ['http'] })).toBe('<iframe src="/a.html"></iframe><a href="http://x" data-x="1">a</a>');
    expect(sanitize(page, {})).toBe('<iframe src="/a.html"></iframe><a>a</a>');
  });

  it('never lets an SVG animation write an href', () => {
    const options: HtmlSanitizerOptions = { allowElements: ['svg', 'a', 'animate', 'set'], allowAttributes: ['attributeName', 'to'] };

    expect(sanitizeHtmlWithReport('<svg><a><set attributeName="href" to="javascript:alert(1)"/><animate attributeName=" XLINK:HREF " to="x"/><animate attributeName="opacity" to="0"/></a></svg>', options)).toEqual({
      html: '<svg><a><set to="javascript:alert(1)"></set><animate to="x"></animate><animate attributename="opacity" to="0"></animate></a></svg>',
      report: { removedElements: [], removedAttributes: ['set[attributename]', 'animate[attributename]'] }
    });
  });
});

describe('sanitizeHtmlWithReport', () => {
  it('reports what it removed', () => {
    expect(sanitizeHtmlWithReport('<p onclick="x()">a<script>b</script></p>')).toEqual({ html: '<p>a</p>', report: { removedElements: ['script'], removedAttributes: ['p[onclick]'] } });
  });

  it('reports nothing when it removed nothing', () => {
    expect(sanitizeHtmlWithReport('<p>a</p>', { allowElements: ['x'] }).report).toBeUndefined();
  });
});
