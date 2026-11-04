import type { ClassDeclaration } from 'typescript';
import type { ResolvedDeclaration } from './resolved-declaration.type';

/**
 * A class declaration together with the file declaring it, needed to resolve
 * the imports its heritage clause and member types refer to.
 */
export type ResolvedClass = ResolvedDeclaration<ClassDeclaration>;
