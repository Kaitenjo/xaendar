/**
 * Utility type to extract the inner type of a Signal.State.
 * @example
 * type MySignal = Signal.State<number>;
 * type ExtractedType = ExtractSignalType<MySignal>; // ExtractedType is number 
 */
export type ExtractSignalType<T> = T extends Signal.State<infer U> ? U : never;
