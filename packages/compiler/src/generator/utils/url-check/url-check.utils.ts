import { holdsUrls, isResourceUrlAttribute } from '@xaendar/internals';
import type { AttributeUrlCheck } from '../../types/attribute-url-check.type';

/**
 * Tells what the runtime checks in the value an expression binds to an attribute, written into the attribute (not an
 * input): an attribute holding URLs (`href`, `src`, `srcset`, `ping`…, see `holdsUrls`) the URLs running code, one loading
 * a resource into the page (the `src` of an `<iframe>`…, see `isResourceUrlAttribute`) the origin of the resource too.
 * It depends on the attribute alone: the runtime applies the `security` of the project using the component, so that a
 * component compiled in a library carries no configuration of its own.
 *
 * @param tagName - The tag name of the element, as written.
 * @param name - The name of the attribute.
 * @returns What the runtime checks, `undefined` when the attribute holds no URL.
 */
export function getUrlCheck(tagName: string, name: string): AttributeUrlCheck | undefined {
  const lowerCase = name.toLowerCase();
  if (isResourceUrlAttribute(tagName.toLowerCase(), lowerCase)) {
    return 'resource';
  }

  return holdsUrls(lowerCase) ? 'url' : undefined;
}

/**
 * Appends to the members of the descriptor of an attribute what the runtime checks in the URLs bound to it (see
 * `RenderElementAttribute.url` and `RenderElementAttribute.resource` of core): `url: true`, plus `resource: true` for an
 * attribute loading a resource.
 *
 * @param members - The members of the descriptor, filled.
 * @param check - What the runtime checks (see {@link getUrlCheck}).
 */
export function appendUrlCheck(members: string[], check: AttributeUrlCheck): void {
  members.push('url: true');
  if (check === 'resource') {
    members.push('resource: true');
  }
}

/**
 * Writes the call checking the URLs an expression binds to an attribute, around the value the server writes (see
 * `_checkUrl` of core): `_checkUrl('href', value)`, `_checkUrl('src', value, true)` for an attribute loading a resource.
 *
 * @param name - The name of the attribute.
 * @param expression - The code of the value.
 * @param check - What the runtime checks (see {@link getUrlCheck}).
 * @returns The code of the call.
 */
export function toUrlCheckCall(name: string, expression: string, check: AttributeUrlCheck): string {
  return check === 'resource' ? `_checkUrl('${name}', ${expression}, true)` : `_checkUrl('${name}', ${expression})`;
}
