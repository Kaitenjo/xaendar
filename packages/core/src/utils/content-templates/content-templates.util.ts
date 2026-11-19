import type { _BoundTemplate } from '../../types/bound-template.type';
import type { _Context } from '../../types/context.type';
import type { _RenderElementTemplate } from '../../types/render-element-template.type';
import { _templateRef } from '../template/template.util';

/**
 * The templates passed as content to each element, in the order they are written: the templates read as values, each
 * one after its name.
 *
 * N.B. Deliberate, to save memory: a `WeakMap` holding an array of the exact number of templates, only for the elements
 * receiving some, instead of a member of every element or a `Map` per element. Do not keep them on the elements.
 */
const contentTemplates = new WeakMap<object, readonly (string | _BoundTemplate)[]>();

/**
 * Passes to the element of a component the templates written among its children (`<my-list><template row(item:
 * Item)>…</template></my-list>`), before the element is connected, so that the component reads them with
 * `@Query.contentTemplate` from its first render, the one of the server and the hydration included: each one is the
 * template read as a value in the context rendering the element, which declares it.
 *
 * @param element - The element of the component, a `ServerElement` on the server.
 * @param context - The context rendering the element.
 * @param templates - The templates written among the children of the element.
 */
export function _setContentTemplates(element: object, context: _Context, templates: readonly _RenderElementTemplate[]): void {
  const entries = new Array<string | _BoundTemplate>(templates.length * 2);
  for (let i = 0; i < templates.length; i++) {
    const { name, template } = templates[i];
    entries[i * 2] = name;
    entries[i * 2 + 1] = _templateRef(context, 0, template);
  }

  contentTemplates.set(element, entries);
}

/**
 * Returns the template passed as content to an element under a name (see {@link _setContentTemplates}).
 *
 * @param element - The element of the component.
 * @param name - The name of the template.
 * @returns The template read as a value, `undefined` if none is passed under the name.
 */
export function getContentTemplate(element: object, name: string): _BoundTemplate | undefined {
  const entries = contentTemplates.get(element);
  if (entries) {
    for (let i = 0; i < entries.length; i += 2) {
      if (entries[i] === name) {
        return entries[i + 1] as _BoundTemplate;
      }
    }
  }

  return undefined;
}
