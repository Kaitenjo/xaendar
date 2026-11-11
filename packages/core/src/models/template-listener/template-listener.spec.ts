// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import type { _Context } from '../../utils/context/context.util';
import { TemplateListener } from './template-listener';

const component = { name: 'component' };
const context = { component } as unknown as _Context;

describe('TemplateListener', () => {
  it('calls the handler of the template with the component as this, the context and the event', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const listener = new TemplateListener(element, { name: 'click', handler }, context);
    const event = new Event('click');

    listener.handleEvent(event);

    expect(handler).toHaveBeenCalledExactlyOnceWith(context, event);
    expect(handler.mock.contexts).toEqual([component]);
  });

  it('handles the events of the element it is added to as an object', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    element.addEventListener('click', new TemplateListener(element, { name: 'click', handler }, context));

    element.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('removes itself from the element, by the name of its event, once disposed', () => {
    const element = document.createElement('button');
    const handler = vi.fn();
    const event: RenderElementEvent = { name: 'click', handler };
    const listener = new TemplateListener(element, event, context);
    element.addEventListener('click', listener);
    const remove = vi.spyOn(element, 'removeEventListener');

    listener.dispose();
    element.dispatchEvent(new Event('click'));

    expect(remove).toHaveBeenCalledExactlyOnceWith('click', listener);
    expect(handler).not.toHaveBeenCalled();
  });
});
