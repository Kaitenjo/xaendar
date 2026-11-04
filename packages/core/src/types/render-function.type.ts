import type { CustomElement } from '../models/custom-element/custom-element';
import type { _Context } from '../utils/context/context.util';
import type { NodeStrategy } from './node-strategy.type';

/**
 * Compiler-generated render function of a template, invoked with the
 * component instance bound as `this`, and with the strategy getting its nodes: created, or adopted from the HTML
 * rendered on the server.
 */
export type RenderFunction = (this: CustomElement, nodeStrategy: NodeStrategy) => _Context;
