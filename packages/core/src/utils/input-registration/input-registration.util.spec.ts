import { describe, expect, it } from 'vitest';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_REQUIRED_INPUTS } from '../../costants';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { registerInput } from './input-registration.util';

describe('registerInput()', () => {
  it('registers the name an input is bound with, its alias or the name of its property', () => {
    const metadata: Partial<WebComponentMetadata> = {};
    registerInput(metadata, 'value', undefined, false);
    registerInput(metadata, 'checked', 'on', false);

    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ value: 'value', on: 'checked' });
    expect(metadata[INTERNAL_REQUIRED_INPUTS]).toBeUndefined();
  });

  it('registers a required input, and removes it when a subclass declares it again optional', () => {
    const parent: Partial<WebComponentMetadata> = {};
    registerInput(parent, 'value', undefined, true);
    const child: Partial<WebComponentMetadata> = Object.create(parent);
    registerInput(child, 'value', undefined, false);

    expect(parent[INTERNAL_REQUIRED_INPUTS]).toEqual(new Set(['value']));
    expect(child[INTERNAL_REQUIRED_INPUTS]).toEqual(new Set());
  });

  it('keeps the inputs of a subclass out of the metadata of its parent', () => {
    const parent: Partial<WebComponentMetadata> = {};
    registerInput(parent, 'value', undefined, false);
    const child: Partial<WebComponentMetadata> = Object.create(parent);
    registerInput(child, 'label', undefined, true);

    expect(parent[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ value: 'value' });
    expect(parent[INTERNAL_REQUIRED_INPUTS]).toBeUndefined();
    expect(child[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ value: 'value', label: 'label' });
  });
});
