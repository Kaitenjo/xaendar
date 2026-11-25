import type { AttributeReader } from '../../types/attribute-reader.type';

/**
 * The attributes of an `<iframe>` restricting the page it holds, which the browser applies only to the next page the
 * frame loads: written from a value after the `src`, they would not restrict the page loaded already. Angular rejects
 * their bindings too.
 */
const IFRAME_POLICY_ATTRIBUTES: ReadonlySet<string> = new Set(['allow', 'allowfullscreen', 'credentialless', 'csp', 'referrerpolicy', 'sandbox']);

/**
 * The SVG animation elements, lowercase, whose `attributeName` chooses the attribute of the element they animate.
 */
const ANIMATION_ELEMENTS: ReadonlySet<string> = new Set(['animate', 'animatemotion', 'animatetransform', 'set']);

/**
 * The attributes of an SVG animation element giving the values it writes into the attribute it animates.
 */
const ANIMATION_VALUE_ATTRIBUTES: ReadonlySet<string> = new Set(['by', 'from', 'to', 'values']);

/**
 * The attributes an SVG animation could give a URL running code, which no check of the URLs reaches: the browser opens
 * the URL an animation writes into an `href`.
 */
const ANIMATED_URL_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'xlink:href']);

/**
 * Tells why binding a value to an attribute, on any element, would run code from the values of the application: an
 * event handler attribute (any name starting with `on`, as Angular checks it), whose value the browser runs, or a
 * `srcdoc`, the document a frame shows. The compiler rejects the bindings of the templates, core the host attributes, as
 * the `rejectUnsafeBindings` of the `security` of `xaendar.json` asks.
 *
 * @param name - The name of the attribute.
 * @returns What the binding does and what to do instead, written after the binding (`Binding onclick …`), `undefined`
 *   for an attribute that is safe to bind.
 */
export function describeUnsafeAttribute(name: string): string | undefined {
  const lowerCase = name.toLowerCase();
  if (lowerCase.startsWith('on')) {
    return `writes code the browser runs from a value of the application: listen to the ${lowerCase.slice(2)} event instead`;
  }

  return lowerCase === 'srcdoc' ? 'writes a document the browser runs from a value of the application: bind the src of a page instead' : undefined;
}

/**
 * Tells why binding a value to an attribute of an element would run code, or lift a restriction, from the values of the
 * application, besides what {@link describeUnsafeAttribute} rejects on any element:
 * - the attributes restricting the page of an `<iframe>` (`sandbox`, `allow`…), which the browser applies only to the
 *   next page it loads;
 * - the `attributeName` of an SVG animation (`<animate>`, `<set>`…), which could make it write a URL running code into
 *   an `href`, and the values (`to`, `from`, `by`, `values`) of one animating an `href`;
 * - the `http-equiv` of a `<meta>`, and the `content` of a `<meta http-equiv="refresh">`, the page it goes to.
 *
 * @param tagName - The tag name of the element.
 * @param name - The name of the attribute.
 * @param element - Reads the other attributes of the element, as written in the template or on the element itself:
 *   `null` or `undefined` for one it does not have.
 * @returns What the binding does and what to do instead, written after the binding (`Binding sandbox …`), `undefined`
 *   for an attribute that is safe to bind on the element.
 */
export function describeUnsafeElementAttribute(tagName: string, name: string, element: AttributeReader): string | undefined {
  const lowerCaseTag = tagName.toLowerCase();
  if (lowerCaseTag === 'iframe') {
    return IFRAME_POLICY_ATTRIBUTES.has(name.toLowerCase()) ? 'sets a restriction of the <iframe> from a value of the application, which the browser applies only to the page it loads next: write it as a static attribute' : undefined;
  }

  if (ANIMATION_ELEMENTS.has(lowerCaseTag)) {
    return describeUnsafeAnimationAttribute(name.toLowerCase(), element);
  }

  if (lowerCaseTag !== 'meta') {
    return undefined;
  }

  const lowerCase = name.toLowerCase();
  if (lowerCase === 'http-equiv') {
    return 'chooses the pragma of the <meta> from a value of the application: write it as a static attribute';
  }

  return lowerCase === 'content' && element.getAttribute('http-equiv')?.toLowerCase() === 'refresh' ? 'writes the page a refresh of the <meta> goes to from a value of the application, which no check of the URLs reaches: write it as a static attribute' : undefined;
}

/**
 * Tells why binding a value to an attribute of an SVG animation element is unsafe (see
 * {@link describeUnsafeElementAttribute}).
 *
 * @param name - The name of the attribute, lowercase.
 * @param element - Reads the other attributes of the element.
 * @returns What the binding does and what to do instead, `undefined` for an attribute that is safe to bind.
 */
function describeUnsafeAnimationAttribute(name: string, element: AttributeReader): string | undefined {
  if (name === 'attributename') {
    return 'chooses the attribute the animation writes from a value of the application, which could give an href a URL running code: write it as a static attribute';
  }

  if (!ANIMATION_VALUE_ATTRIBUTES.has(name)) {
    return undefined;
  }

  const animated = element.getAttribute('attributeName')?.toLowerCase();
  return animated !== undefined && ANIMATED_URL_ATTRIBUTES.has(animated) ? `writes into ${animated} a value of the application, which no check of the URLs reaches: bind ${animated} itself instead` : undefined;
}
