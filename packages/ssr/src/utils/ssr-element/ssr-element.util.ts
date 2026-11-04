import { escapeAttribute, escapeRawText } from '@xaendar/common';
import { _applyHostProperties, _CLIENT_ATTRIBUTE, _getComponentRuntime, _HYDRATE_ATTRIBUTE, _resolveDirective, _SERVER_INPUTS_ATTRIBUTE, _SET_DIRECTIVE_ELEMENT, _selectBranch, _setExpressionClass, _stringifyState, CustomDirective, type _Context, type CustomElement, type RenderConditionalBinding, type WebComponentOptions } from '@xaendar/core';
import type { Constructor, Dictionary, Function } from '@xaendar/types';
import { ServerElement } from '../../dom/server-element/server-element';
import type { ClientComponentOptions } from '../../types/client-component-options.type';
import type { ServerBindings } from '../../types/server-bindings.type';
import type { ServerDirective } from '../../types/server-directive.type';
import type { ServerAttribute } from '../../types/server-attribute.type';
import type { ServerOutput } from '../../types/server-output.type';
import { _getServerRender } from '../server-render-registry/server-render-registry.util';
import type { ServerRenderDefinition } from '../../types/server-render-definition.type';
import type { ServerRuntime } from '../../types/server-runtime.type';

/**
 * Writes the start tag of an element with its bindings, applied as the client applies them: the attributes and the
 * classes in order, through the setters of the client, then the ones of the branches the conditional bindings select.
 * Then the custom directives are applied, the ones of the element first, then the ones of the selected branches: each
 * one is constructed, its properties are set, `onInit` runs and the attributes and the classes of its `@HostProperty`
 * are written. Its effects do not run, its events are not listened to and `onDestroy` never runs: the browser applies
 * it again. The content a directive assigns to `innerHTML` is written right after the start tag, as it is: the
 * children of the template follow it, so an element whose content a directive assigns has none.
 *
 * @param out - The output.
 * @param context - The runtime context of the element.
 * @param tagName - The tag name of the element.
 * @param attributes - The attributes and the classes of the element.
 * @param conditionalBindings - The conditional bindings of the element.
 * @param directives - The custom directives of the element, if any.
 * @throws When no custom directive is registered for the selector of a directive.
 */
export function _ssrStartTag(out: ServerOutput, context: _Context, tagName: string, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[], directives?: ServerDirective[]): void {
  const element = new ServerElement();
  element.localName = tagName;
  // The directives of the selected branches, applied once every binding of the element is, as the client does
  const branchDirectives = conditionalBindings.length ? new Array<ServerDirective[]>() : undefined;
  applyBindings(element as unknown as Element, context, attributes, conditionalBindings, undefined, branchDirectives);
  if (directives?.length) {
    applyDirectives(element, context, directives);
  }

  if (branchDirectives?.length) {
    for (let i = 0; i < branchDirectives.length; i++) {
      applyDirectives(element, context, branchDirectives[i]);
    }
  }

  out.push(writeStartTag(tagName, element as unknown as Element));
  if (element.innerHTML !== undefined) {
    out.push(element.innerHTML);
  }
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
  renderOrWriteComponent(out, context, tagName, attributes, conditionalBindings, element => {
    applyBindings(element, context, attributes, conditionalBindings);
    return undefined;
  });
}

/**
 * Writes an interactive component a static one renders (see {@link _ssrComponent}): no template sets its inputs in the
 * browser, since the static component is not there, so the ones bound here are written into its `data-xd-inputs`
 * attribute, by the name of their property, which tells the browser to hydrate it by itself.
 *
 * @param out - The output.
 * @param context - The runtime context of the element.
 * @param tagName - The tag name of the component.
 * @param attributes - The attributes and the classes of the element.
 * @param conditionalBindings - The conditional bindings of the element.
 * @throws When a value of an input cannot be written into the HTML.
 */
export function _ssrIsland(out: ServerOutput, context: _Context, tagName: string, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[]): void {
  renderOrWriteComponent(out, context, tagName, attributes, conditionalBindings, element => {
    const inputs: Dictionary<string, unknown> = {};
    applyBindings(element, context, attributes, conditionalBindings, inputs);
    return _stringifyState(inputs, `<${tagName}>`);
  });
}

/**
 * Writes the start tag of a component rendering only in the browser, declaring `ssr: { render: false }`: no code of the
 * component runs, and its class may not be there, since the server does not evaluate its module for the templates
 * rendering it. Its attributes are written, its inputs are not: the template rendering it sets them in the browser, and
 * a static one writes them into `data-xd-inputs`, reading only there their expressions. The code calling it writes the
 * light DOM and the end tag.
 *
 * @param out - The output.
 * @param context - The runtime context of the element.
 * @param tagName - The tag name of the component.
 * @param attributes - The attributes and the classes of the element.
 * @param conditionalBindings - The conditional bindings of the element.
 * @param options - What the compiler knows of the component.
 * @throws When a value of an input cannot be written into the HTML.
 */
export function _ssrClientComponent(out: ServerOutput, context: _Context, tagName: string, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[], options: ClientComponentOptions): void {
  const element = new ServerElement();
  element.localName = tagName;
  const inputs: Dictionary<string, unknown> = {};
  applyClientBindings(element as unknown as Element, context, attributes, conditionalBindings, options, inputs);
  writeClientComponent(out, tagName, element as unknown as Element, options.island ? _stringifyState(inputs, `<${tagName}>`) : undefined, options.hydrate);
}

/**
 * Writes the root of a page rendering only in the browser (see {@link _ssrClientComponent}): the browser sets its inputs
 * from `data-xd-inputs`, as for any root.
 *
 * @param out - The output.
 * @param tagName - The tag name of the component.
 * @param Component - The class of the component.
 * @param serializedInputs - The inputs, serialized, if any.
 */
export function _writeClientRoot(out: ServerOutput, tagName: string, Component: Constructor<CustomElement>, serializedInputs: string | undefined): void {
  writeClientComponent(out, tagName, new ServerElement() as unknown as Element, serializedInputs, getSsrMetadata(Component)?.hydrate);
}

/**
 * Tells whether a component renders only in the browser.
 *
 * @param Component - The class of the component.
 * @returns `true` when it declares `ssr: { render: false }`.
 */
export function _isClientComponent(Component: Constructor<CustomElement>): boolean {
  return getSsrMetadata(Component)?.render === false;
}

/**
 * Writes the start tag of a component rendering only in the browser, with the attributes telling the browser to wait
 * before rendering it.
 *
 * @param out - The output.
 * @param tagName - The tag name of the component.
 * @param element - The element, holding its other attributes.
 * @param serializedInputs - The inputs to write into `data-xd-inputs`, serialized, if any.
 * @param hydrate - The trigger of the component, if any.
 */
function writeClientComponent(out: ServerOutput, tagName: string, element: Element, serializedInputs: string | undefined, hydrate: string | undefined): void {
  element.setAttribute(_CLIENT_ATTRIBUTE, '');
  if (hydrate && hydrate !== 'load') {
    element.setAttribute(_HYDRATE_ATTRIBUTE, hydrate);
  }

  if (serializedInputs !== undefined) {
    element.setAttribute(_SERVER_INPUTS_ATTRIBUTE, serializedInputs);
  }

  out.push(writeStartTag(tagName, element));
}

/**
 * Returns what the `@WebComponent` of a class stores about the rendering on the server.
 *
 * @param Component - The class of the component.
 * @returns The metadata of the class, if any.
 */
function getSsrMetadata(Component: Constructor<CustomElement>): WebComponentOptions['ssr'] {
  return (Component as unknown as Record<symbol, WebComponentOptions['ssr']>)[Symbol.for('Symbol.metadata')];
}

/**
 * Renders a component, or writes the start tag of a custom element without a class rendering on the server.
 *
 * @param out - The output.
 * @param context - The runtime context of the element.
 * @param tagName - The tag name of the element.
 * @param attributes - The attributes and the classes of the element.
 * @param conditionalBindings - The conditional bindings of the element.
 * @param bind - Binds the component (see {@link _renderComponent}).
 */
function renderOrWriteComponent(out: ServerOutput, context: _Context, tagName: string, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[], bind: Function<[element: CustomElement], string | undefined>): void {
  const Component = customElements.get(tagName) as Constructor<CustomElement> | undefined;
  const definition = Component && _getServerRender(Component);
  if (!Component || !definition) {
    _ssrStartTag(out, context, tagName, attributes, conditionalBindings);
    return;
  }

  _renderComponent(out, tagName, Component, definition, bind);
}

/**
 * Renders a component as the client does when it connects it, writing its start tag and its declarative shadow root:
 * the component is constructed and bound, then `onInit` runs and the template is rendered into the shadow root, the
 * stylesheet first, and the attributes and the classes `@HostProperty` declares are written once the template is
 * rendered, before the start tag is, with the trigger hydrating the element its `@WebComponent` declares, if other than
 * `load`, in `data-xd-hydrate`. `afterRender` does not run, since nothing is rendered into a document.
 *
 * @param out - The output.
 * @param tagName - The tag name of the component.
 * @param Component - The class of the component.
 * @param definition - What the server renders the component with.
 * @param bind - Binds the component before `onInit` runs. It returns the inputs no template sets in the browser,
 *   serialized, if any: the ones of the root of a page or of a component a static one renders, written into the
 *   `data-xd-inputs` attribute of its start tag, which the browser sets them from (see `CustomElement`). Set once the
 *   template is rendered, the attribute is never read by the code of the component.
 */
export function _renderComponent<Component extends CustomElement>(out: ServerOutput, tagName: string, Component: Constructor<Component>, definition: ServerRenderDefinition, bind: Function<[element: Component], string | undefined>): void {
  collectEvents(Component, definition);
  const element = new Component();
  const serializedInputs = bind(element);
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
  const hydrate = getSsrMetadata(Component)?.hydrate;
  if (hydrate && hydrate !== 'load') {
    element.setAttribute(_HYDRATE_ATTRIBUTE, hydrate);
  }

  if (serializedInputs !== undefined) {
    element.setAttribute(_SERVER_INPUTS_ATTRIBUTE, serializedInputs);
  }

  out[startTag] = writeStartTag(tagName, element);
}

/**
 * Adds the events a component listens to, in its template and with `@HostEvent`, to the ones the event contract of the
 * page records. Rendered outside of a page, by code calling the helpers by itself, there is no contract to tell.
 *
 * @param Component - The class of the component.
 * @param definition - What the server renders the component with.
 */
function collectEvents(Component: Constructor<CustomElement>, { render }: ServerRenderDefinition): void {
  const pageEvents = (_getComponentRuntime() as Partial<ServerRuntime>).events;
  if (!pageEvents) {
    return;
  }

  if (render.events?.length) {
    for (let i = 0; i < render.events.length; i++) {
      pageEvents.add(render.events[i]);
    }
  }

  const hostEvents = (Component as unknown as Record<symbol, { hostEvents?: Array<{ name: string }> } | undefined>)[Symbol.for('Symbol.metadata')]?.hostEvents;
  if (hostEvents?.length) {
    for (let i = 0; i < hostEvents.length; i++) {
      pageEvents.add(hostEvents[i].name);
    }
  }
}

/**
 * Applies the bindings of an element: the attributes and the classes in order, then the ones of the branch each
 * conditional binding selects, nested ones included.
 *
 * @param element - The element.
 * @param context - The runtime context of the element.
 * @param attributes - The attributes and the classes.
 * @param conditionalBindings - The conditional bindings.
 * @param inputs - Collects the values bound to the inputs of a component, as written in the template, by the name of
 *   their property, if they are needed.
 * @param directives - Collects the custom directives of the selected branches, if they are applied.
 */
function applyBindings(element: Element, context: _Context, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[], inputs?: Dictionary<string, unknown>, directives?: ServerDirective[][]): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, value, setter } = attributes[i];
    setter(context, element, name, value);
    const property = inputs && setter !== _setExpressionClass ? getInputProperty(element, name) : undefined;
    if (property) {
      inputs![property] = typeof value === 'function' ? value() : value;
    }
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const branch = _selectBranch(conditionalBindings[i]);
    if (branch) {
      applyBindings(element, context, branch.attributes, branch.conditionalBindings, inputs, directives);
      if (directives && branch.directives?.length) {
        directives.push(branch.directives);
      }
    }
  }
}

/**
 * Applies custom directives to an element, as the client does once its bindings are applied (see {@link _ssrStartTag}):
 * each one is constructed and given the element, its properties are set, then `onInit` runs and the attributes and the
 * classes of its `@HostProperty` are written.
 *
 * @param element - The element.
 * @param context - The runtime context of the element.
 * @param directives - The directives.
 * @throws When no custom directive is registered for the selector of a directive.
 */
function applyDirectives(element: ServerElement, context: _Context, directives: ServerDirective[]): void {
  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes } = directives[i];
    const Directive = _resolveDirective(selector, CustomDirective);
    const directive = new Directive();
    directive[_SET_DIRECTIVE_ELEMENT] = element as unknown as Element;
    for (let j = 0; j < attributes.length; j++) {
      const { name, value, setter } = attributes[j];
      setter(context, directive, name, value);
    }

    directive.onInit?.();
    _applyHostProperties(directive, element as unknown as Element);
  }
}

/**
 * Applies the bindings of the element of a component rendering only in the browser: the attributes and the classes as
 * {@link applyBindings} does, the inputs collected only when no template sets them in the browser.
 *
 * @param element - The element.
 * @param context - The runtime context of the element.
 * @param attributes - The attributes and the classes.
 * @param conditionalBindings - The conditional bindings.
 * @param options - What the compiler knows of the component.
 * @param inputs - Collects the values bound to the inputs, by the name of their property.
 */
function applyClientBindings(element: Element, context: _Context, attributes: ServerAttribute[], conditionalBindings: RenderConditionalBinding<ServerBindings>[], options: ClientComponentOptions, inputs: Dictionary<string, unknown>): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, value, setter } = attributes[i];
    const property = setter === _setExpressionClass ? undefined : options.inputs[name];
    if (!property) {
      setter(context, element, name, value);
    } else if (options.island) {
      inputs[property] = typeof value === 'function' ? value() : value;
    }
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const branch = _selectBranch(conditionalBindings[i]);
    if (branch) {
      applyClientBindings(element, context, branch.attributes, branch.conditionalBindings, options, inputs);
    }
  }
}

/**
 * Finds the input of a component an attribute of a template binds.
 *
 * @param element - The element of the component.
 * @param name - The name of the attribute: the alias of the input, or the name of its property.
 * @returns The name of the property, `undefined` when the attribute binds no input.
 */
function getInputProperty(element: Element, name: string): string | undefined {
  const metadata = (element.constructor as unknown as Record<symbol, { aliasToAttribute?: Dictionary<string, string> } | undefined>)[Symbol.for('Symbol.metadata')];
  return metadata?.aliasToAttribute?.[name];
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
