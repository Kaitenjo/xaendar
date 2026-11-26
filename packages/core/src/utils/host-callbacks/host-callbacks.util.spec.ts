// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { ResolvedHostDirectives } from '../../types/web-component/resolved-host-directives.type';
import { _applyHostCallbacks } from './host-callbacks.util';

/**
 * The host directives of a component, as `_resolveHostDirectives` gives them.
 */
function resolved(...directives: Array<new () => CustomDirective>): ResolvedHostDirectives {
  return { directives: directives.map(directive => ({ directive: directive as never, events: undefined as never })), inputs: null };
}

/**
 * A directive recording the form callbacks it receives.
 */
class Recorder extends CustomDirective {
  public readonly calls = new Array<unknown[]>();

  public formAssociatedCallback(form: HTMLFormElement | null): void {
    this.calls.push(['associated', form]);
  }

  public formDisabledCallback(disabled: boolean): void {
    this.calls.push(['disabled', disabled]);
  }

  public formResetCallback(): void {
    this.calls.push(['reset']);
  }

  public formStateRestoreCallback(state: unknown, mode: string): void {
    this.calls.push(['restore', state, mode]);
  }
}

/**
 * A directive declaring no form callback.
 */
class Plain extends CustomDirective { }

describe('_applyHostCallbacks', () => {
  it('makes the class form-associated for a host directive declaring a form callback, leaving the others as they are', () => {
    class Field extends CustomElement { }
    class Other extends CustomElement { }

    _applyHostCallbacks(Field, resolved(Plain, Recorder));
    _applyHostCallbacks(Other, resolved(Plain));

    expect((Field as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
    expect('formAssociated' in Other).toBe(false);
    expect('formResetCallback' in Other.prototype).toBe(false);
  });

  it('forwards the form callbacks to every host directive declaring them, with their arguments', () => {
    class Field extends CustomElement { }
    _applyHostCallbacks(Field, resolved(Recorder, Plain));
    const recorder = new Recorder();
    const element = Object.create(Field.prototype) as CustomElement & Record<string, (...args: unknown[]) => void>;
    element.hostDirectives = new Map<never, CustomDirective>([[Recorder as never, recorder], [Plain as never, new Plain()]]) as never;
    const form = document.createElement('form');

    element.formAssociatedCallback(form);
    element.formDisabledCallback(true);
    element.formResetCallback();
    element.formStateRestoreCallback('3', 'restore');

    expect(recorder.calls).toEqual([['associated', form], ['disabled', true], ['reset'], ['restore', '3', 'restore']]);
  });

  it('leaves a callback the class or an ancestor declares, which calls the one of the directive itself', () => {
    class Parent extends CustomElement {
      public formResetCallback(): void { }
    }
    class Field extends Parent { }
    const own = Parent.prototype.formResetCallback;

    _applyHostCallbacks(Field, resolved(Recorder));

    expect(Field.prototype.formResetCallback).toBe(own);
    expect(Object.hasOwn(Field.prototype, 'formDisabledCallback')).toBe(true);
  });
});
