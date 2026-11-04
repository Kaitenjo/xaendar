import type { DirectiveDecorator } from './typescript-decorator-nodes/directive-decorator.type';
import type { WebComponentDecorator } from './typescript-decorator-nodes/web-component-decorator.type';

/**
 * Class decorators identifying the classes metadata are extracted from.
 */
export type ClassDecoratorNode = WebComponentDecorator | DirectiveDecorator;
