import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { describe, expect, it, vi } from 'vitest';
import { getComponentParts } from './component-parts.utils';

/**
 * The metadata of a component of the project, declared in `/src/tabs/tabs.ts`.
 */
const component = (templateUrl?: string) => ({ type: 'component', className: 'Tabs', selector: 'x-tabs', modulePath: '/src/tabs/tabs.ts', templateUrl, properties: new Map(), events: new Map() }) as unknown as ComponentOrDirectiveMetadata;

describe('getComponentParts', () => {
  it('reads the parts of the template of a component of the project, again only when its text changes', () => {
    let text = '<button part="tab"></button>';
    const read = vi.fn((fileName: string) => (fileName.replaceAll('\\', '/').endsWith('/src/tabs/tabs.html') ? text : undefined));
    const first = getComponentParts(component('./tabs.html'), read);
    expect(first).toEqual({ names: ['tab'] });
    expect(getComponentParts(component('./tabs.html'), read)).toBe(first);

    text = '<button part="tab" part.selected="{on}"></button>';
    expect(getComponentParts(component('./tabs.html'), read)).toEqual({ names: ['tab', 'selected'] });
  });

  it('knows no part of a template that cannot be read or parsed, nor of a directive', () => {
    expect(getComponentParts(component('./missing.html'), () => undefined)).toBeUndefined();
    expect(getComponentParts(component('./broken.html'), () => '<p part.="{a}"></p>')).toBeUndefined();
    expect(getComponentParts({ type: 'directive' } as ComponentOrDirectiveMetadata, () => '')).toBeUndefined();
  });

  it('gives none for a component without template, and the ones of its manifest for a component of a library', () => {
    expect(getComponentParts(component(), () => undefined)).toEqual({ names: [] });

    const parts = { names: ['icon'], open: true } as const;
    expect(getComponentParts({ ...component(), library: {}, parts } as unknown as ComponentOrDirectiveMetadata)).toBe(parts);
    expect(getComponentParts({ ...component(), library: {} } as unknown as ComponentOrDirectiveMetadata)).toBeUndefined();
  });
});
