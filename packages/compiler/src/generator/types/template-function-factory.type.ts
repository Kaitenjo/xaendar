import type { Function } from '@xaendar/types';
import type { TemplateNode } from '../../parser/types/nodes/template-node.type';
import type { ElementNamespace } from '../../types/element-namespace.type';
import type { CompilerContext } from '../models/compiler-context/compiler-context.model';
import type { GeneratorFunctionToProcess } from './generator-function-to-process.type';

/**
 * Describes the function rendering an instance of a template, which each generator writes in its own shape (see
 * {@link declareScope}).
 *
 * @param template - The template.
 * @param key - The name of the function.
 * @param namespace - The namespace the content of the template is created in, the one of its declaration.
 * @param compilerContext - The compiler context of the scope declaring the template.
 * @returns The function.
 */
export type TemplateFunctionFactory = Function<[template: TemplateNode, key: string, namespace: ElementNamespace, compilerContext: CompilerContext], GeneratorFunctionToProcess>;
