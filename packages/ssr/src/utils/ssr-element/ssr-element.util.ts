import { escapeAttribute, escapeRawText } from '@xaendar/common';
import { _applyHostProperties, _COMPONENT, _CLIENT_ATTRIBUTE, _getComponentRuntime, _HYDRATE_ATTRIBUTE, _resolveDirective, _SERVER_INPUTS_ATTRIBUTE, _SET_DIRECTIVE_ELEMENT, _selectBranch, _setContentTemplates, _setExpressionInput, _setInput, _stringifyState, CustomDirective, type _Context, type CustomElement, type WebComponentOptions } from '@xaendar/core';
import type { Constructor, Dictionary, Function } from '@xaendar/types';
import { ServerElement } from '../../dom/server-element/server-element';
import type { ClientComponentOptions } from '../../types/client-component-options.type';
import type { ServerBindings } from '../../types/server-bindings.type';
import type { ServerDirective } from '../../types/server-directive.type';
import type { ServerAttribute } from '../../types/server-attribute.type';
import type { ServerElementConfig } from '../../types/server-element-config.type';
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
 * @param config - The element, a constant of the module of the template: its tag name, its attributes and its classes,
 *   its conditional bindings and its custom directives.
 * @throws When no custom directive is registered for the selector of a directive.
 */
export function _ssrStartTag(out: ServerOutput, context: _Context, config: ServerElementConfig): void {
  const { tagName, directives } = config;
  const element = new ServerElement();
  element.localName = tagName;
  // The directives of the selected branches, applied once every binding of the element is, as the client does
  const branchDirectives = config.conditionalBindings?.length ? new Array<readonly ServerDirective[]>() : undefined;
  applyBindings(element as unknown as Element, context, config, undefined, branchDirectives);
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
 * @param config - The element, a constant of the module of the template: its tag name, its attributes and its classes,
 *   and its conditional bindings.
 */
export function _ssrComponent(out: ServerOutput, context: _Context, config: ServerElementConfig): void {
  renderOrWriteComponent(out, context, config, element => {
    applyBindings(element, context, config);
    // Passed like the inputs, before the component renders, as the client passes them before connecting it
    if (config.templates) {
      _setContentTemplates(element, context, config.templates);
    }

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
 * @param config - The element, a constant of the module of the template: its tag name, its attributes and its classes,
 *   and its conditional bindings.
 * @throws When a value of an input cannot be written into the HTML.
 */
export function _ssrIsland(out: ServerOutput, context: _Context, config: ServerElementConfig): void {
  // The browser hydrates an island by itself, from its inputs: no template of the static one is there to render
  if (config.templates) {
    throw new Error(`<${config.tagName}> is an interactive component a static one renders, which hydrates by itself in the browser: it cannot receive templates as content`);
  }

  renderOrWriteComponent(out, context, config, element => {
    const inputs: Dictionary<string, unknown> = {};
    applyBindings(element, context, config, inputs);
    return _stringifyState(inputs, `<${config.tagName}>`);
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
 * @param config - The element, a constant of the module of the template: its tag name, its attributes and its classes,
 *   and its conditional bindings.
 * @param options - What the compiler knows of the component, a constant of the module of the template.
 * @throws When a value of an input cannot be written into the HTML.
 */
export function _ssrClientComponent(out: ServerOutput, context: _Context, config: ServerElementConfig, options: ClientComponentOptions): void {
  const { tagName } = config;
  const element = new ServerElement();
  element.localName = tagName;
  const inputs: Dictionary<string, unknown> = {};
  applyClientBindings(element as unknown as Element, context, config, options, inputs);
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
 * @param config - The element: its tag name and its bindings.
 * @param bind - Binds the component (see {@link _renderComponent}).
 */
function renderOrWriteComponent(out: ServerOutput, context: _Context, config: ServerElementConfig, bind: Function<[element: CustomElement], string | undefined>): void {
  const { tagName } = config;
  const Component = customElements.get(tagName) as Constructor<CustomElement> | undefined;
  const definition = Component && _getServerRender(Component);
  if (!Component || !definition) {
    _ssrStartTag(out, context, config);
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
 * Adds the events a component listens to, in its template and with `@HostListener` on its element, to the ones the
 * event contract of the page records. A `@HostListener` of the window or of the document is left out: it hears the
 * events from when it is added, and there is no element of the component to replay them to. Rendered outside of a page,
 * by code calling the helpers by itself, there is no contract to tell.
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

  const hostListeners = (Component as unknown as Record<symbol, { hostListeners?: Array<{ name: string, target?: string }> } | undefined>)[Symbol.for('Symbol.metadata')]?.hostListeners;
  if (hostListeners?.length) {
    for (let i = 0; i < hostListeners.length; i++) {
      const { name, target } = hostListeners[i];
      if (!target) {
        pageEvents.add(name);
      }
    }
  }
}

/**
 * Applies the bindings of an element: the attributes and the classes in order, through their setters, then the ones of
 * the branch each conditional binding selects, nested ones included.
 *
 * @param element - The element.
 * @param context - The runtime context of the element, which the expressions read.
 * @param bindings - The bindings of the element, or of a branch.
 * @param inputs - Collects the values bound to the inputs of a component, by the name of their property, if they are
 *   needed.
 * @param directives - Collects the custom directives of the selected branches, if they are applied.
 */
function applyBindings(element: Element, context: _Context, bindings: ServerBindings, inputs?: Dictionary<string, unknown>, directives?: Array<readonly ServerDirective[]>): void {
  const { attributes, conditionalBindings } = bindings;
  if (attributes?.length) {
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      attribute.setter(context, element, attribute);
      if (inputs && isInputSetter(attribute.setter)) {
        inputs[attribute.name] = valueOf(attribute, context);
      }
    }
  }

  if (conditionalBindings?.length) {
    for (let i = 0; i < conditionalBindings.length; i++) {
      const branch = _selectBranch(conditionalBindings[i], context);
      if (branch) {
        applyBindings(element, context, branch, inputs, directives);
        if (directives && branch.directives?.length) {
          directives.push(branch.directives);
        }
      }
    }
  }
}

/**
 * Computes the value of a binding: the literal, or the value of its expression, a function of the module of the
 * template called with the component and the context.
 *
 * @param attribute - The binding.
 * @param context - The runtime context of the element.
 * @returns The value.
 */
function valueOf({ value }: ServerAttribute, context: _Context): unknown {
  return typeof value === 'function' ? value.call(context[_COMPONENT], context) : value;
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
function applyDirectives(element: ServerElement, context: _Context, directives: readonly ServerDirective[]): void {
  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes } = directives[i];
    const Directive = _resolveDirective(selector, CustomDirective);
    const directive = new Directive();
    directive[_SET_DIRECTIVE_ELEMENT] = element as unknown as Element;
    if (attributes?.length) {
      for (let j = 0; j < attributes.length; j++) {
        const attribute = attributes[j];
        attribute.setter(context, directive, attribute);
      }
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
 * @param context - The runtime context of the element, which the expressions read.
 * @param bindings - The bindings of the element, or of a branch.
 * @param options - What the compiler knows of the component.
 * @param inputs - Collects the values bound to the inputs, by the name of their property.
 */
function applyClientBindings(element: Element, context: _Context, bindings: ServerBindings, options: ClientComponentOptions, inputs: Dictionary<string, unknown>): void {
  const { attributes, conditionalBindings } = bindings;
  if (attributes?.length) {
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      if (!isInputSetter(attribute.setter)) {
        attribute.setter(context, element, attribute);
      } else if (options.island) {
        inputs[attribute.name] = valueOf(attribute, context);
      }
    }
  }

  if (conditionalBindings?.length) {
    for (let i = 0; i < conditionalBindings.length; i++) {
      const branch = _selectBranch(conditionalBindings[i], context);
      if (branch) {
        applyClientBindings(element, context, branch, options, inputs);
      }
    }
  }
}

/**
 * Tells whether the setter of a binding sets an input: the compiler binds the inputs it knows through the setters of the
 * inputs, by the name of their property.
 *
 * @param setter - The setter of the binding.
 * @returns `true` when it sets an input.
 */
function isInputSetter(setter: ServerAttribute['setter']): boolean {
  return setter === _setInput || setter === _setExpressionInput;
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
