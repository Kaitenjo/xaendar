import { Cursor } from '../cursor.model';
import { LexerTransitionFunctionContext } from './transition-function-context.type';
import { LexerTransitionFunctionReturnType } from './transition-function-return-type.type';

export type LexerTransitionFunction = (cursor: Cursor, context: LexerTransitionFunctionContext) => LexerTransitionFunctionReturnType;