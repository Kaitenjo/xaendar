import { _Context, _setExpressionProperty } from '@xaendar/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '../../i18n/en.json';
import { DocsDemoComponent } from './docs-demo.xd.component';

// the texts are fetched at runtime, and reading them before that throws
vi.mock('../../core/i18n/i18n', () => ({ translations: () => en }));

/**
 * Mounts the component as the template of a page does, with its inputs bound.
 *
 * Mounting renders the frame, and happy-dom reports on stderr that it will not load its page: that is
 * expected, the frame is rendered with its attributes anyway. Tests that only need the address read the
 * computed signal instead, which the template binds, and mount nothing.
 */
function mount(name: string): DocsDemoComponent {
  const element = document.createElement('docs-demo');
  if (!(element instanceof DocsDemoComponent)) {
    throw new Error('docs-demo is not defined');
  }

  const context = new _Context({} as never);
  _setExpressionProperty(context, element, 'name', () => name);
  _setExpressionProperty(context, element, 'heading', () => 'A demo');
  document.body.append(element);

  return element;
}

/**
 * Builds the component without rendering it, to read what it computes from its inputs.
 */
function create(name: string): DocsDemoComponent {
  const element = document.createElement('docs-demo');
  if (!(element instanceof DocsDemoComponent)) {
    throw new Error('docs-demo is not defined');
  }

  _setExpressionProperty(new _Context({} as never), element, 'name', () => name);
  return element;
}

describe('DocsDemoComponent', () => {
  afterEach(() => document.body.replaceChildren());

  /*
    The page is named, and not only its folder: the dev server answers a request for a folder it has no page
    for with the index.html of the documentation, and the frame would show the documentation itself.
  */
  it('addresses the page of the application by its file name, not by its folder', () => {
    expect(create('react').src()).toBe('demos/react/index.html');
    expect(create('next').src()).toBe('demos/next/index.html');
  });

  it('renders a frame on that page, loaded only when the reader reaches it', () => {
    const frame = mount('vue').shadowRoot?.querySelector('iframe');

    expect(frame?.getAttribute('src')).toBe('demos/vue/index.html');
    expect(frame?.getAttribute('loading')).toBe('lazy');
  });

  // the files are loaded by an effect of onInit, so this one needs a rendered component
  it('leaves the source files alone until they are asked for', async () => {
    const element = mount('react');

    expect(element.files()).toEqual([]);
    element.toggleCode();
    await vi.waitFor(() => expect(element.files().length).toBeGreaterThan(0));
    expect(element.files().map(file => file.name)).toContain('src/App.tsx');
    expect(element.current().code).toContain('setValue');
  });
});
