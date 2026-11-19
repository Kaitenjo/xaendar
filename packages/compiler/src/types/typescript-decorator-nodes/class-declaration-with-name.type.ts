import type { ClassDeclaration } from 'typescript';

/**
 * Represents a class declaration that is guaranteed to have a name.
 */
export type ClassDeclarationWithName = Omit<ClassDeclaration, 'name'> & Required<Pick<ClassDeclaration, 'name'>>;
