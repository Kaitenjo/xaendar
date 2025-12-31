import { Cursor } from './cursor.model';
import { LexerTransitionFunctionReturnType } from './transition-function-return-type.type';

export type LexerTransitionFunction = (cursor: Cursor) => LexerTransitionFunctionReturnType;