import type { ComponentMetadata } from '@xaendar/compiler';
import { isClassDeclaration, type Node, Program, Type, TypeChecker, TypeFlags, type TypeReference } from 'typescript';

/**
 * The flags of the types whose values are always written into the HTML.
 */
const SERIALIZABLE_FLAGS = TypeFlags.StringLike | TypeFlags.NumberLike | TypeFlags.BooleanLike | TypeFlags.BigIntLike | TypeFlags.Undefined | TypeFlags.Null | TypeFlags.Void;

/**
 * The objects of the standard library the HTML carries (see `_stringifyState`).
 */
const SERIALIZABLE_OBJECTS: ReadonlySet<string> = new Set(['Date', 'Map', 'Set']);

/**
 * The name of the symbol of an object literal.
 */
const OBJECT_LITERAL = '__object';

/**
 * The start of the name the type checker gives the key of the type an input accepts from outside, the unique symbol
 * `INCOMING_VALUE` of the type `InputSignal` of `@xaendar/core`.
 */
const INCOMING_VALUE_KEY = '__@INCOMING_VALUE@';

/**
 * Tells whether the values of an input of a component can reach the browser written into the HTML, which is how a
 * component receives the inputs a static one binds: by its declared type, since the value is known only on the server.
 * The type is the one the input accepts from outside, before its `transform`, since `data-xd-inputs` holds the values
 * as they are bound: the second type argument of its `InputSignal`, which defaults to the type of its value.
 * A type that cannot be read, as `any` or `unknown`, cannot be written, and so can an exposed input of a host directive,
 * which does not exist on the server.
 *
 * @param program - The program of the project.
 * @param metadata - The metadata of the component.
 * @param name - The name the input is written with in a template.
 * @returns `true` when its values can be written.
 */
export function isSerializableInput(program: Program, metadata: ComponentMetadata, name: string): boolean {
  const property = metadata.properties.get(name)!;
  const klass = program.getSourceFile(metadata.modulePath)?.statements.find(statement => isClassDeclaration(statement) && statement.name?.text === metadata.className);
  if (property.exposed || !klass) {
    return false;
  }

  const checker = program.getTypeChecker();
  const symbol = checker.getTypeAtLocation(klass).getProperty(property.name);
  const type = symbol && getIncomingType(checker.getTypeOfSymbolAtLocation(symbol, klass), checker, klass);
  return !!type && isSerializableType(type, checker, new Set());
}

/**
 * Finds the type an input accepts from outside: the type the function under the key `INCOMING_VALUE` of its
 * `InputSignal` returns, or, for a signal without it, the type of its value, the one the signal returns.
 *
 * @param signal - The type of the input signal.
 * @param checker - The type checker.
 * @param location - The class declaring the input, where the types are read.
 * @returns The type, `undefined` when the input is not a signal.
 */
function getIncomingType(signal: Type, checker: TypeChecker, location: Node): Type | undefined {
  const incoming = signal.getProperties().find(property => property.getName().startsWith(INCOMING_VALUE_KEY));
  // The key is optional: its type holds `undefined` too
  const reader = incoming ? checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(incoming, location)) : signal;
  return reader.getCallSignatures()[0]?.getReturnType();
}

/**
 * Tells whether the values of a type can be written into the HTML: primitives, arrays, `Date`, `Map`, `Set` and objects
 * holding only those. Functions, symbols and the instances of the other classes cannot.
 *
 * @param type - The type.
 * @param checker - The type checker.
 * @param visited - The types being read, for the recursive ones.
 * @returns `true` when they can be written.
 */
function isSerializableType(type: Type, checker: TypeChecker, visited: Set<Type>): boolean {
  if (type.flags & SERIALIZABLE_FLAGS || visited.has(type)) {
    return true;
  }

  if (type.isUnionOrIntersection()) {
    return type.types.every(part => isSerializableType(part, checker, visited));
  }

  if (!(type.flags & TypeFlags.Object) || type.getCallSignatures().length || type.getConstructSignatures().length || type.isClass()) {
    return false;
  }

  visited.add(type);
  const symbol = type.getSymbol();
  if (checker.isArrayType(type) || checker.isTupleType(type) || SERIALIZABLE_OBJECTS.has(symbol!.name)) {
    return checker.getTypeArguments(type as TypeReference).every(argument => isSerializableType(argument, checker, visited));
  }

  // A symbol with a value, unless it is an object literal, is an object of a class of the standard library
  if (symbol!.valueDeclaration && symbol!.name !== OBJECT_LITERAL) {
    return false;
  }

  const declaration = symbol!.declarations?.[0];
  return checker.getIndexInfosOfType(type).every(({ type: value }) => isSerializableType(value, checker, visited))
    && checker.getPropertiesOfType(type).every(property => isSerializableType(checker.getTypeOfSymbolAtLocation(property, declaration!), checker, visited));
}
