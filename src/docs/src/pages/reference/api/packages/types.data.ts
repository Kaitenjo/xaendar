import type { ApiPackage } from '../api.data';
import { ABSTRACT_CONSTRUCTOR, ACCESSOR_DECORATOR, ASYNC_FUNCTION, BEAUTIFY, CLASS_DECORATOR, CONSTRUCTOR, CONTAINS_CHAR, DECORATOR_METADATA_CONTEXT, DICTIONARY, FIELD_DECORATOR, FUNCTION, GETTER_DECORATOR, METHOD_DECORATOR, MUTABLE, POSITIVE_INTEGER, REQUIRE_ONE, TUPLE_OF_LENGTH } from './types.snippets';

/**
 * The symbols of `@xaendar/types`.
 */
export const TYPES_API: ApiPackage = {
  name: '@xaendar/types',
  symbols: [
    {
      name: 'Beautify',
      kind: 'type',
      signature: `type Beautify<T extends Object> = {
  [K in keyof T]: T[K]
} & {};`,
      usage: [{ key: 'reading', snippets: [BEAUTIFY] }]
    },
    {
      name: 'AbstractConstructor',
      kind: 'type',
      signature: `type AbstractConstructor<
  T extends object = object,
  Statics extends Record<string, unknown> | undefined = undefined
> = (abstract new (...args: any[]) => T) & (Statics extends undefined ? object : Statics) & {
  prototype: T
};`,
      members: [
        { name: 'T', group: 'parameters', signature: 'T extends object = object' },
        { name: 'Statics', group: 'parameters', signature: 'Statics extends Record<string, unknown> | undefined = undefined' }
      ],
      usage: [{ key: 'abstractClasses', snippets: [ABSTRACT_CONSTRUCTOR] }]
    },
    {
      name: 'Constructor',
      kind: 'type',
      signature: `type Constructor<
  T extends object = object,
  Statics extends Record<string, unknown> | undefined = undefined
> = (new (...args: any[]) => T) & (Statics extends undefined ? object : Statics) & {
  prototype: T
};`,
      members: [
        { name: 'T', group: 'parameters', signature: 'T extends object = object' },
        { name: 'Statics', group: 'parameters', signature: 'Statics extends Record<string, unknown> | undefined = undefined' }
      ],
      usage: [{ key: 'creatingInstances', snippets: [CONSTRUCTOR] }]
    },
    {
      name: 'ContainsChar',
      kind: 'type',
      signature: `type ContainsChar<
  String extends string,
  Contains extends string
> =
  String extends \`\${infer First}\${infer Rest}\`
    ? First extends Contains
      ? true
      : ContainsChar<Rest, Contains>
    : false;`,
      usage: [{ key: 'rejectingLiterals', snippets: [CONTAINS_CHAR] }]
    },
    {
      name: 'ClassAccessorDecoratorValue',
      kind: 'type',
      signature: `type ClassAccessorDecoratorValue<Field = unknown> = {
  get(this: unknown): Field;
  set(this: unknown, value: Field): void;
};`,
      usage: [{ key: 'originalSetter', snippets: [ACCESSOR_DECORATOR] }]
    },
    {
      name: 'AccessorDecorator',
      kind: 'type',
      signature: `type AccessorDecorator<
  Class extends object,
  Value = unknown,
  Metadata extends object = DecoratorMetadataObject
> = (value: ClassAccessorDecoratorValue<Value>, context: DecoratorMetadataContext<ClassAccessorDecoratorContext<Class, Value>, Metadata>) => {
  get?(this: Class): Value;
  set?(this: Class, value: Value): void;
  init?(this: Class, initialValue: Value): Value;
} | void;`,
      members: [
        { name: 'Class', group: 'parameters', signature: 'Class extends object' },
        { name: 'Value', group: 'parameters', signature: 'Value = unknown' },
        { name: 'Metadata', group: 'parameters', signature: 'Metadata extends object = DecoratorMetadataObject' }
      ],
      usage: [{ key: 'writing', snippets: [ACCESSOR_DECORATOR] }]
    },
    {
      name: 'ClassDecorator',
      kind: 'type',
      signature: `type ClassDecorator<
  T extends Object,
  Statics extends { [key: string]: any } = { [key: string]: any },
  Metadata extends object = DecoratorMetadataObject
> = (klass: Constructor<T, Statics>, context: DecoratorMetadataContext<ClassDecoratorContext<Constructor<T, Statics>>, Metadata>) => void;`,
      members: [
        { name: 'T', group: 'parameters', signature: 'T extends Object' },
        { name: 'Statics', group: 'parameters', signature: 'Statics extends { [key: string]: any } = { [key: string]: any }' },
        { name: 'Metadata', group: 'parameters', signature: 'Metadata extends object = DecoratorMetadataObject' }
      ],
      usage: [{ key: 'registering', snippets: [CLASS_DECORATOR] }]
    },
    {
      name: 'DecoratorMetadataContext',
      kind: 'type',
      signature: `type DecoratorMetadataContext<
  Context extends { metadata: DecoratorMetadataObject },
  Metadata extends object = DecoratorMetadataObject
> = Omit<Context, 'metadata'> & {
  metadata: Partial<Metadata>
};`,
      members: [
        { name: 'Context', group: 'parameters', signature: 'Context extends { metadata: DecoratorMetadataObject }' },
        { name: 'Metadata', group: 'parameters', signature: 'Metadata extends object = DecoratorMetadataObject' }
      ],
      usage: [{ key: 'typing', snippets: [DECORATOR_METADATA_CONTEXT] }]
    },
    {
      name: 'FieldDecorator',
      kind: 'type',
      signature: `type FieldDecorator<
  Class extends Object,
  Field,
  ReturnType = Field,
  Metadata extends object = DecoratorMetadataObject
> = (field: undefined, context: DecoratorMetadataContext<ClassFieldDecoratorContext<Class, Field>, Metadata>) => ((value: Field) => ReturnType) | void;`,
      members: [
        { name: 'Class', group: 'parameters', signature: 'Class extends Object' },
        { name: 'Field', group: 'parameters', signature: 'Field' },
        { name: 'ReturnType', group: 'parameters', signature: 'ReturnType = Field' },
        { name: 'Metadata', group: 'parameters', signature: 'Metadata extends object = DecoratorMetadataObject' }
      ],
      usage: [{ key: 'transforming', snippets: [FIELD_DECORATOR] }]
    },
    {
      name: 'GetterDecorator',
      kind: 'type',
      signature: `type GetterDecorator<
  Class extends Object,
  Value,
  Metadata extends object = DecoratorMetadataObject
> = (value: (this: Class) => Value, context: DecoratorMetadataContext<ClassGetterDecoratorContext<Class, Value>, Metadata>) => ((this: Class) => Value) | void;`,
      members: [
        { name: 'Class', group: 'parameters', signature: 'Class extends Object' },
        { name: 'Value', group: 'parameters', signature: 'Value' },
        { name: 'Metadata', group: 'parameters', signature: 'Metadata extends object = DecoratorMetadataObject' }
      ],
      usage: [{ key: 'replacing', snippets: [GETTER_DECORATOR] }]
    },
    {
      name: 'MethodDecorator',
      kind: 'type',
      signature: `type MethodDecorator<
  T extends Object,
  Method extends Function,
  Metadata extends object = DecoratorMetadataObject
> = (value: Method, context: DecoratorMetadataContext<ClassMethodDecoratorContext<T, Method>, Metadata>) => Method | void;`,
      members: [
        { name: 'T', group: 'parameters', signature: 'T extends Object' },
        { name: 'Method', group: 'parameters', signature: 'Method extends Function' },
        { name: 'Metadata', group: 'parameters', signature: 'Metadata extends object = DecoratorMetadataObject' }
      ],
      usage: [{ key: 'wrapping', snippets: [METHOD_DECORATOR] }]
    },
    {
      name: 'Dictionary',
      kind: 'type',
      signature: `type Dictionary<Key extends string | number | symbol, Value = string> = {
  [K in Key]?: Value
};`,
      usage: [{ key: 'optionalKeys', snippets: [DICTIONARY] }]
    },
    {
      name: 'AsyncFunction',
      kind: 'type',
      signature: `type AsyncFunction<
  Arguments extends any[] = any[],
  ReturnType = void
> = Arguments extends Array<any>
  ? (...args: Arguments) => Promise<ReturnType>
  : () => Promise<ReturnType>;`,
      usage: [{ key: 'typing', snippets: [ASYNC_FUNCTION] }]
    },
    {
      name: 'Function',
      kind: 'type',
      signature: `type Function<
  Arguments extends any[] = any[],
  ReturnType = void
> = Arguments extends Array<any>
  ? (...args: Arguments) => ReturnType
  : () => ReturnType;`,
      usage: [{ key: 'building', snippets: [FUNCTION] }]
    },
    {
      name: 'NoArgsAsyncFunction',
      kind: 'type',
      signature: 'type NoArgsAsyncFunction<ReturnType = void> = () => Promise<ReturnType>;'
    },
    {
      name: 'NoArgsFunction',
      kind: 'type',
      signature: 'type NoArgsFunction<ReturnType = void> = () => ReturnType;'
    },
    {
      name: 'NoArgsAsyncVoidFunction',
      kind: 'type',
      signature: 'type NoArgsAsyncVoidFunction = () => Promise<void>;'
    },
    {
      name: 'NoArgsVoidFunction',
      kind: 'type',
      signature: 'type NoArgsVoidFunction = () => void;'
    },
    {
      name: 'VoidAsyncFunction',
      kind: 'type',
      signature: 'type VoidAsyncFunction<Arguments extends any[] = any[]> = (...args: Arguments) => Promise<void>;'
    },
    {
      name: 'VoidFunction',
      kind: 'type',
      signature: 'type VoidFunction<Arguments extends any[] = any[]> = (...args: Arguments) => void;'
    },
    {
      name: 'Mutable',
      kind: 'type',
      signature: `type Mutable<T extends Object> = {
  -readonly [P in keyof T]: T[P];
};`,
      usage: [{ key: 'building', snippets: [MUTABLE] }]
    },
    {
      name: 'PositiveInteger',
      kind: 'type',
      signature: `type PositiveInteger<Value extends number> =
  ContainsChar<\`\${Value}\`, '-'> extends true
    ? never
    : ContainsChar<\`\${Value}\`, '.'> extends true
      ? never
      : Value;`,
      usage: [{ key: 'checkingACount', snippets: [POSITIVE_INTEGER] }]
    },
    {
      name: 'RequireOne',
      kind: 'type',
      signature: `type RequireOne<T extends Object, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];`,
      members: [
        { name: 'Keys', group: 'parameters', signature: 'Keys extends keyof T = keyof T' }
      ],
      usage: [{ key: 'requiringOne', snippets: [REQUIRE_ONE] }]
    },
    {
      name: 'TupleOfLength',
      kind: 'type',
      signature: `type TupleOfLength<
  Length extends number,
  TupleType = number,
  Acc extends TupleType[] = []
> = PositiveInteger<Length> extends never
      ? never
      : Acc['length'] extends Length
        ? Acc
        : TupleOfLength<Length, TupleType, [...Acc, TupleType]>;`,
      usage: [{ key: 'fixedLength', snippets: [TUPLE_OF_LENGTH] }]
    }
  ]
};
