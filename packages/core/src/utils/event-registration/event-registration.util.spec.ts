import { describe, expect, it } from 'vitest';
import { INTERNAL_EVENTS } from '../../costants';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { registerEvent } from './event-registration.util';

describe('registerEvent()', () => {
  it('registers the name of an event', () => {
    const metadata: Partial<WebComponentMetadata> = {};
    registerEvent(metadata, 'opened');
    registerEvent(metadata, 'valueChange');

    expect(metadata[INTERNAL_EVENTS]).toEqual(new Set(['opened', 'valueChange']));
  });

  it('keeps the events of a subclass out of the metadata of its parent', () => {
    const parent: Partial<WebComponentMetadata> = {};
    registerEvent(parent, 'opened');
    const child: Partial<WebComponentMetadata> = Object.create(parent);
    registerEvent(child, 'closed');

    expect(parent[INTERNAL_EVENTS]).toEqual(new Set(['opened']));
    expect(child[INTERNAL_EVENTS]).toEqual(new Set(['opened', 'closed']));
  });
});
