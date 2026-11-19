import { describe, expect, it } from 'vitest';
import { MODEL_CHANGE_SUFFIX, toModelChangeEvent, toModelName } from './model.util';

describe('toModelChangeEvent()', () => {
  it('appends the suffix of the change to the name of the model', () => {
    expect(toModelChangeEvent('value')).toBe('valueChange');
    expect(toModelChangeEvent('user-id')).toBe('user-idChange');
  });
});

describe('toModelName()', () => {
  it('removes the suffix of the change from the name of the event', () => {
    expect(toModelName('valueChange')).toBe('value');
  });

  it('returns undefined for a name not ending with the suffix', () => {
    expect(toModelName('changed')).toBeUndefined();
  });

  it('returns undefined for the suffix alone', () => {
    expect(toModelName(MODEL_CHANGE_SUFFIX)).toBeUndefined();
  });
});
