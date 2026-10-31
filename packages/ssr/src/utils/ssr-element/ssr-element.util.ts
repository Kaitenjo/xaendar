import { escapeAttribute, escapeRawText } from '@xaendar/common';
import { _applyHostProperties, _selectBranch, type _Context, type CustomElement, type RenderConditionalBinding } from '@xaendar/core';
import type { Constructor, VoidFunction } from '@xaendar/types';
import { ServerElement } from '../../dom/server-element/server-element';
import type { ServerBindings } from '../../types/server-bindings.type';
import type { ServerAttribute } from '../../types/server-attribute.type';
import type { ServerOutput } from '../../types/server-output.type';
import { _getServerRender } from '../server-render-registry/server-render-registry.util';
import type { ServerRenderDefinition } from '../../types/server-render-definition.type';

/**
 * Writes the start tag of an element with its bindings, applied as the client applies them: the attributes and the
 * classes in order, through the setters of the client, then the ones of the branches the conditional bindings select.
 *
 * @param out - The output.
 * @param context - The runtime context of the element.
 * @param tagName - The tag name of the element.
 * @param attributes - The attributes and the classes of the element.
 * @param conditionalBindings - The conditional bindings of the element.
 */
export function _ssrStartTag(out: ServerOutput, context: _Context, tagName: string, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[]): void {
  const element = new ServerElement();
  element.localName = tagName;
  applyBindings(element as unknown as Element, context, attributes, conditionalBindings);
  out.push(writeStartTag(tagName, element as unknown as Element));
}

/**
 * Writes the start tag and the shadow root of a component (see {@link _renderComponent}), its bindings applied as the
 * client applies them: an input is set, any other attribute written. The code calling it writes the light DOM and the
 * end tag. A custom element without a class rendering on the server, such as one imported with `@import lazy` or one
 * of a library compiled only for the browser, is written as an element without shadow root, which the browser renders
 * once its class is defined.
 *
 * @param out - The output.
 * @param context - The runtime context of the element.
 * @param tagName - The tag name of the component.
 * @param attributes - The attributes and the classes of the element.
 * @param conditionalBindings - The conditional bindings of the element.
 */
export function _ssrComponent(out: ServerOutput, context: _Context, tagName: string, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[]): void {
  const Component = customElements.get(tagName) as Constructor<CustomElement> | undefined;
  const definition = Component && _getServerRender(Component);
  if (!Component || !definition) {
    _ssrStartTag(out, context, tagName, attributes, conditionalBindings);
    return;
  }

  _renderComponent(out, tagName, Component, definition, element => applyBindings(element, context, attributes, conditionalBindings));
}

/**
 * Renders a component as the client does when it connects it, writing its start tag and its declarative shadow root:
 * the component is constructed and bound, then `onInit` runs and the template is rendered into the shadow root, the
 * stylesheet first, and the attributes and the classes `@HostProperty` declares are written once the template is
 * rendered, before the start tag is. `afterRender` does not run, since nothing is rendered into a document.
 *
 * @param out - The output.
 * @param tagName - The tag name of the component.
 * @param Component - The class of the component.
 * @param definition - What the server renders the component with.
 * @param bind - Binds the component before `onInit` runs.
 */
export function _renderComponent<Component extends CustomElement>(out: ServerOutput, tagName: string, Component: Constructor<Component>, definition: ServerRenderDefinition, bind: VoidFunction<[element: Component]>): void {
  const element = new Component();
  bind(element);
  element.onInit?.();

  // The start tag is written in its place once the template is rendered, with the attributes of the host
  const startTag = out.push('') - 1;
  out.push('<template shadowrootmode="open">');
  if (definition.css) {
    out.push(`<style>${escapeRawText(definition.css, 'style')}</style>`);
  }
  definition.render.call(element, out);
  out.push('</template>');

  _applyHostProperties(element, element);
  out[startTag] = writeStartTag(tagName, element);
}

/**
 * Applies the bindings of an element: the attributes and the classes in order, then the ones of the branch each
 * conditional binding selects, nested ones included.
 *
 * @param element - The element.
 * @param context - The runtime context of the element.
 * @param attributes - The attributes and the classes.
 * @param conditionalBindings - The conditional bindings.
 */
function applyBindings(element: Element, context: _Context, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[]): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, value, setter } = attributes[i];
    setter(context, element, name, value);
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const branch = _selectBranch(conditionalBindings[i]);
    if (branch) {
      applyBindings(element, context, branch.attributes, branch.conditionalBindings);
    }
  }
}

/**
 * Writes the start tag of an element, with its attributes in the order they are written.
 *
 * @param tagName - The tag name of the element.
 * @param element - The element.
 * @returns The start tag.
 */
function writeStartTag(tagName: string, element: Element): string {
  let tag = `<${tagName}`;
  const names = element.getAttributeNames();
  for (let i = 0; i < names.length; i++) {
    tag = `${tag} ${names[i]}="${escapeAttribute(element.getAttribute(names[i])!)}"`;
  }

  return `${tag}>`;
}
