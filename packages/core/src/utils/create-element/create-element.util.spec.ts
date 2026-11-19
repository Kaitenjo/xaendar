// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { MATHML_NS, SVG_NS } from '../../costants';
import { closeTryScope, openTryScope } from '../try-scope/try-scope.util';
import { _createElement, _createMATHMLElement, _createSVGElement, createNamespacedElement } from './create-element.util';

const HTML_NS = 'http://www.w3.org/1999/xhtml';

describe('createNamespacedElement', () => {
  it('creates an element in the namespace the constant of the element names, HTML when it names none', () => {
    expect(createNamespacedElement('a', undefined).namespaceURI).toBe(HTML_NS);
    expect(createNamespacedElement('a', 1).namespaceURI).toBe(SVG_NS);
    expect(createNamespacedElement('mi', 2).namespaceURI).toBe(MATHML_NS);
  });

  it('constructs an HTML custom element through _createElement, so that a @try catches the error of its constructor', () => {
    const failure = new Error('constructor');
    customElements.define('x-namespaced-failing', class extends HTMLElement {
      constructor() {
        super();
        throw failure;
      }
    });
    const scope = openTryScope();

    try {
      expect(() => createNamespacedElement('x-namespaced-failing', undefined)).toThrow(failure);
    } finally {
      closeTryScope(scope);
    }
  });
});

describe('element factories', () => {
  it('creates an HTML element', () => {
    expect(_createElement('section').tagName).toBe('SECTION');
  });

  it('constructs a custom element defined by its class in the content of a @try, so that the error of its constructor is thrown', () => {
    const failure = new Error('constructor');
    let fails = false;
    class Failing extends HTMLElement {
      constructor() {
        super();
        if (fails) {
          throw failure;
        }
      }
    }
    customElements.define('x-factory-failing', Failing);
    const create = vi.spyOn(document, 'createElement');
    const scope = openTryScope();

    try {
      expect(_createElement('x-factory-failing')).toBeInstanceOf(Failing);
      expect(_createElement('x-factory-undefined').localName).toBe('x-factory-undefined');
      fails = true;
      expect(() => _createElement('x-factory-failing')).toThrow(failure);
    } finally {
      closeTryScope(scope);
    }

    expect(create.mock.calls).toEqual([['x-factory-undefined']]);
    create.mockRestore();
  });

  it('creates an SVG element in the SVG namespace', () => {
    expect(_createSVGElement('circle').namespaceURI).toBe(SVG_NS);
  });

  it('creates a MathML element in the MathML namespace', () => {
    expect(_createMATHMLElement('mi').namespaceURI).toBe(MATHML_NS);
  });
});
