import type { ComponentMetadata, DirectiveMetadata } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { isClientComponent } from './client-component.utils';

describe('isClientComponent', () => {
  it('tells apart the components rendering only in the browser', () => {
    expect(isClientComponent({ type: 'component', clientOnly: {} } as ComponentMetadata)).toBe(true);
    expect(isClientComponent({ type: 'component' } as ComponentMetadata)).toBe(false);
    expect(isClientComponent({ type: 'directive' } as DirectiveMetadata)).toBe(false);
  });
});
