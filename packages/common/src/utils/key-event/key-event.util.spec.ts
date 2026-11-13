import { describe, expect, it } from 'vitest';
import { KEY_MODIFIERS, parseKeyEvent } from './key-event.util';

describe('parseKeyEvent()', () => {
  it('returns undefined for an event that is not a key event', () => {
    expect(parseKeyEvent('click')).toBeUndefined();
    expect(parseKeyEvent('keydown')).toBeUndefined();
    expect(parseKeyEvent('keydownx')).toBeUndefined();
    expect(parseKeyEvent('keypress.enter')).toBeUndefined();
    expect(parseKeyEvent('my-event:done.x')).toBeUndefined();
  });

  it('reads the key of keydown and keyup', () => {
    expect(parseKeyEvent('keydown.enter')).toEqual({ event: 'keydown', key: 'enter', modifiers: 0 });
    expect(parseKeyEvent('keyup.a')).toEqual({ event: 'keyup', key: 'a', modifiers: 0 });
  });

  it('reads the key in lowercase, esc as escape', () => {
    expect(parseKeyEvent('keydown.Enter')).toEqual({ event: 'keydown', key: 'enter', modifiers: 0 });
    expect(parseKeyEvent('keydown.esc')).toEqual({ event: 'keydown', key: 'escape', modifiers: 0 });
    expect(parseKeyEvent('keydown.space')).toEqual({ event: 'keydown', key: 'space', modifiers: 0 });
  });

  it('reads the modifiers in any order', () => {
    const { control, shift, alt, meta } = KEY_MODIFIERS;
    expect(parseKeyEvent('keydown.control.shift.z')).toEqual({ event: 'keydown', key: 'z', modifiers: control | shift });
    expect(parseKeyEvent('keydown.shift.control.z')).toEqual({ event: 'keydown', key: 'z', modifiers: control | shift });
    expect(parseKeyEvent('keyup.Alt.META.x')).toEqual({ event: 'keyup', key: 'x', modifiers: alt | meta });
  });

  it('reads a modifier alone as the key', () => {
    expect(parseKeyEvent('keydown.shift')).toEqual({ event: 'keydown', key: 'shift', modifiers: 0 });
  });

  it('reads code, matching the code of the key', () => {
    expect(parseKeyEvent('keydown.code.keyA')).toEqual({ event: 'keydown', key: 'keya', modifiers: 0, code: true });
    expect(parseKeyEvent('keydown.alt.code.digit1')).toEqual({ event: 'keydown', key: 'digit1', modifiers: KEY_MODIFIERS.alt, code: true });
  });

  it('throws for a key event naming no key', () => {
    expect(() => parseKeyEvent('keydown.')).toThrow('The key event "keydown." names no key: write it after the last dot, e.g. keydown.enter');
    expect(() => parseKeyEvent('keyup.shift.')).toThrow('The key event "keyup.shift." names no key: write it after the last dot, e.g. keyup.enter');
  });

  it('throws for a modifier that does not exist', () => {
    expect(() => parseKeyEvent('keydown.ctrl.s')).toThrow('"ctrl" is not a modifier of the key event "keydown.ctrl.s": alt, control, meta, shift or code');
    expect(() => parseKeyEvent('keydown..s')).toThrow('"" is not a modifier of the key event "keydown..s": alt, control, meta, shift or code');
    expect(() => parseKeyEvent('keydown.toString.s')).toThrow('"tostring" is not a modifier');
  });

  it('throws for a modifier named twice', () => {
    expect(() => parseKeyEvent('keydown.shift.Shift.a')).toThrow('The key event "keydown.shift.Shift.a" names "shift" twice');
    expect(() => parseKeyEvent('keydown.code.code.keya')).toThrow('The key event "keydown.code.code.keya" names "code" twice');
  });
});
