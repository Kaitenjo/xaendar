import type { ApiPackage } from '../api.data';

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
      usage: [{ key: 'reading', snippets: ['api/types/beautify.ts'] }]
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
      usage: [{ key: 'abstractClasses', snippets: ['api/types/abstract-constructor.ts'] }]
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
      usage: [{ key: 'creatingInstances', snippets: ['api/types/constructor.ts'] }]
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
      usage: [{ key: 'rejectingLiterals', snippets: ['api/types/contains-char.ts'] }]
    },
    {
      name: 'ClassAccessorDecoratorValue',
      kind: 'type',
      signature: `type ClassAccessorDecoratorValue<Field = unknown> = {
  get(this: unknown): Field;
  set(this: unknown, value: Field): void;
};`,
      usage: [{ key: 'originalSetter', snippets: ['api/types/accessor-decorator.ts'] }]
    },
    {
      name: 'AccessorDecorator',
      kind: 'type',
      signature: `type AccessorDecorator<
  Class extends object,
  Value = unknown
> = (value: ClassAccessorDecoratorValue<Value>, context: ClassAccessorDecoratorContext<Class, Value>) => {
  get?(this: Class): Value;
  set?(this: Class, value: Value): void;
  init?(this: Class, initialValue: Value): Value;
} | void;`,
      members: [
        { name: 'Class', group: 'parameters', signature: 'Class extends object' },
        { name: 'Value', group: 'parameters', signature: 'Value = unknown' }
      ],
      usage: [{ key: 'writing', snippets: ['api/types/accessor-decorator.ts'] }]
    },
    {
      name: 'ClassDecorator',
      kind: 'type',
      signature: `type ClassDecorator<
  T extends Object,
  Statics extends { [key: string]: any } = { [key: string]: any }
> = (klass: Constructor<T, Statics>, context: ClassDecoratorContext) => void;`,
      members: [
        { name: 'T', group: 'parameters', signature: 'T extends Object' },
        { name: 'Statics', group: 'parameters', signature: 'Statics extends { [key: string]: any } = { [key: string]: any }' }
      ],
      usage: [{ key: 'registering', snippets: ['api/types/class-decorator.ts'] }]
    },
    {
      name: 'FieldDecorator',
      kind: 'type',
      signature: `type FieldDecorator<
  Class extends Object,
  Field,
  ReturnType = Field
> = (field: undefined, context: ClassFieldDecoratorContext<Class, Field>) => ((value: Field) => ReturnType);`,
      members: [
        { name: 'Class', group: 'parameters', signature: 'Class extends Object' },
        { name: 'Field', group: 'parameters', signature: 'Field' },
        { name: 'ReturnType', group: 'parameters', signature: 'ReturnType = Field' }
      ],
      usage: [{ key: 'transforming', snippets: ['api/types/field-decorator.ts'] }]
    },
    {
      name: 'MethodDecorator',
      kind: 'type',
      signature: `type MethodDecorator<
  T extends Object,
  Method extends Function
> = (value: Method, context: ClassMethodDecoratorContext<T, Method>) => Method | void;`,
      members: [
        { name: 'T', group: 'parameters', signature: 'T extends Object' },
        { name: 'Method', group: 'parameters', signature: 'Method extends Function' }
      ],
      usage: [{ key: 'wrapping', snippets: ['api/types/method-decorator.ts'] }]
    },
    {
      name: 'Dictionary',
      kind: 'type',
      signature: `type Dictionary<Key extends string | number | symbol, Value = string> = {
  [K in Key]?: Value
};`,
      usage: [{ key: 'optionalKeys', snippets: ['api/types/dictionary.ts'] }]
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
      usage: [{ key: 'typing', snippets: ['api/types/async-function.ts'] }]
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
      usage: [{ key: 'building', snippets: ['api/types/function.ts'] }]
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
      usage: [{ key: 'building', snippets: ['api/types/mutable.ts'] }]
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
      usage: [{ key: 'checkingACount', snippets: ['api/types/positive-integer.ts'] }]
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
      usage: [{ key: 'requiringOne', snippets: ['api/types/require-one.ts'] }]
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
      usage: [{ key: 'fixedLength', snippets: ['api/types/tuple-of-length.ts'] }]
    }
  ]
};
