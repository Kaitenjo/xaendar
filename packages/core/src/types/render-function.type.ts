import type { CustomElement } from '../models/custom-element/custom-element';
import type { _Context } from '../utils/context/context.util';

/**
 * Compiler-generated render function of a template, invoked with the
 * component instance bound as `this`.
 */
export type RenderFunction = (this: CustomElement) => _Context;
