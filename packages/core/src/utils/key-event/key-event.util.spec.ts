// @vitest-environment happy-dom
import { KEY_MODIFIERS } from '@xaendar/common';
import { describe, expect, it } from 'vitest';
import { _isKey } from './key-event.util';

describe('_isKey()', () => {
  const { alt, control, meta, shift } = KEY_MODIFIERS;

  it('matches the key pressed, in lowercase', () => {
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Enter' }), 'enter', 0)).toBe(true);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Escape' }), 'enter', 0)).toBe(false);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'A', shiftKey: true }), 'a', shift)).toBe(true);
  });

  it('reads a space as space and a dot as dot', () => {
    expect(_isKey(new KeyboardEvent('keydown', { key: ' ' }), 'space', 0)).toBe(true);
    expect(_isKey(new KeyboardEvent('keydown', { key: '.' }), 'dot', 0)).toBe(true);
  });

  it('requires exactly the modifiers of the filter', () => {
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }), 'enter', 0)).toBe(false);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'z' }), 'z', control)).toBe(false);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }), 'z', control)).toBe(false);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }), 'z', control | shift)).toBe(true);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'x', altKey: true, metaKey: true }), 'x', alt | meta)).toBe(true);
  });

  it('leaves out the modifier that is the key itself', () => {
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Shift', shiftKey: true }), 'shift', 0)).toBe(true);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }), 'control', 0)).toBe(true);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Alt', altKey: true }), 'alt', 0)).toBe(true);
    expect(_isKey(new KeyboardEvent('keydown', { key: 'Meta', metaKey: true }), 'meta', 0)).toBe(true);
  });

  it('matches the code of the key with a filter by code', () => {
    const event = new KeyboardEvent('keydown', { key: 'q', code: 'KeyA' });
    expect(_isKey(event, 'keya', 0, true)).toBe(true);
    expect(_isKey(event, 'keya', 0)).toBe(false);
  });

  it('matches no filter for an event without key', () => {
    expect(_isKey(new Event('keydown') as KeyboardEvent, 'enter', 0)).toBe(false);
    expect(_isKey(new KeyboardEvent('keydown'), 'enter', 0, true)).toBe(false);
  });
});
