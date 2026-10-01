// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT } from '../../costants';
import { CustomDirective } from './custom-directive';

class TestDirective extends CustomDirective {
  public readonly reactToChangesSpy = vi.fn<() => Array<() => void> | undefined>();

  public reactToChanges(): Array<() => void> | undefined {
    return this.reactToChangesSpy();
  }
}

describe('CustomDirective', () => {
  it('does not react to changes until it is connected', () => {
    const directive = new TestDirective(document.createElement('div'));

    expect(directive.reactToChangesSpy).not.toHaveBeenCalled();
  });

  it('reacts to changes when connected', () => {
    const directive = new TestDirective(document.createElement('div'));
    directive[DIRECTIVE_CONNECT]();

    expect(directive.reactToChangesSpy).toHaveBeenCalledOnce();
  });

  it('invokes the unlisten functions returned by reactToChanges when disposed', () => {
    const directive = new TestDirective(document.createElement('div'));
    const unlisten = vi.fn();
    directive.reactToChangesSpy.mockReturnValue([unlisten]);
    directive[DIRECTIVE_CONNECT]();

    expect(unlisten).not.toHaveBeenCalled();
    directive[DIRECTIVE_DISCONNECT]();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('can be disposed when reactToChanges returns no unlisten function', () => {
    const directive = new TestDirective(document.createElement('div'));
    directive[DIRECTIVE_CONNECT]();

    expect(() => directive[DIRECTIVE_DISCONNECT]()).not.toThrow();
  });

  it('dispatches events on the element it is applied to', () => {
    const element = document.createElement('div');
    const listener = vi.fn();
    element.addEventListener('changed', listener);

    const event = new CustomEvent('changed');
    expect(new TestDirective(element).dispatchEvent(event)).toBe(true);
    expect(listener).toHaveBeenCalledWith(event);
  });
});
