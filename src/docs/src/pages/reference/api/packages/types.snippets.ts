import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `abstract-constructor.ts`, shown by the API reference of types.
 */
export const ABSTRACT_CONSTRUCTOR: SourceFile = {
  name: 'abstract-constructor.ts',
  lang: 'ts',
  code: `import type { AbstractConstructor } from '@xaendar/types';

/**
 * A shape of a drawing.
 */
abstract class Shape {
  /**
   * Computes the area of the shape.
   *
   * @returns The area, in square pixels.
   */
  public abstract area(): number;
}

/**
 * Keeps the items that are instances of a class.
 *
 * @param items - The items to filter.
 * @param type - The class, abstract or not.
 * @returns The instances of the class, in order.
 */
function instancesOf<Instance extends object>(items: readonly unknown[], type: AbstractConstructor<Instance>): Instance[] {
  return items.filter((item): item is Instance => item instanceof type);
}

instancesOf(drawing.items, Shape); // Shape[]: Constructor<Shape> would reject an abstract class`
};

/**
 * The snippet `accessor-decorator.ts`, shown by the API reference of types.
 */
export const ACCESSOR_DECORATOR: SourceFile = {
  name: 'accessor-decorator.ts',
  lang: 'ts',
  code: `import type { AccessorDecorator } from '@xaendar/types';

/**
 * Keeps a number accessor between two bounds, from its initial value on.
 *
 * @param min - The lowest value.
 * @param max - The highest value.
 * @returns The decorator.
 */
function Clamp(min: number, max: number): AccessorDecorator<object, number> {
  const clamp = (input: number): number => Math.min(Math.max(input, min), max);
  return value => ({
    init: initialValue => clamp(initialValue),
    set(next) {
      value.set.call(this, clamp(next)); // the original setter, with the instance as this
    }
  });
}

/**
 * The volume of a player.
 */
class Volume {
  /**
   * The level, from 0 to 10.
   */
  @Clamp(0, 10)
  public accessor level = 5;
}

/**
 * A player at full volume.
 */
const volume = new Volume();
volume.level = 15;
volume.level; // 10`
};

/**
 * The snippet `async-function.ts`, shown by the API reference of types.
 */
export const ASYNC_FUNCTION: SourceFile = {
  name: 'async-function.ts',
  lang: 'ts',
  code: `import type { AsyncFunction } from '@xaendar/types';

/**
 * Loads a user by id: (id: number) => Promise<User>
 */
type LoadUser = AsyncFunction<[id: number], User>;

/**
 * Reads the user from the server.
 */
const loadUser: LoadUser = async id => {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
};`
};

/**
 * The snippet `beautify.ts`, shown by the API reference of types.
 */
export const BEAUTIFY: SourceFile = {
  name: 'beautify.ts',
  lang: 'ts',
  code: `import type { Beautify, RequireOne } from '@xaendar/types';

/**
 * The fields of every record.
 */
type Entity = {
  /**
   * The unique identifier.
   */
  id: number;
};

/**
 * A user. Hover: Entity & { name: string; }
 */
type User = Entity & {
  /**
   * The name shown to the others.
   */
  name: string;
};

/**
 * The same type. Hover: { id: number; name: string; }
 */
type FlatUser = Beautify<User>;

/**
 * A union is flattened member by member.
 * Hover: { id: number; name?: string | undefined; } | { name: string; id?: number | undefined; }
 */
type UserQuery = Beautify<RequireOne<Partial<FlatUser>>>;`
};

/**
 * The snippet `class-decorator.ts`, shown by the API reference of types.
 */
export const CLASS_DECORATOR: SourceFile = {
  name: 'class-decorator.ts',
  lang: 'ts',
  code: `import type { ClassDecorator, Constructor } from '@xaendar/types';

/**
 * The classes of the pages, by path.
 */
const routes = new Map<string, Constructor<HTMLElement>>();

/**
 * Registers the class of a page under a path.
 *
 * @param path - The path of the page.
 * @returns The decorator.
 */
function Route(path: string): ClassDecorator<HTMLElement> {
  return target => {
    routes.set(path, target);
  };
}

/**
 * ✓ The page of the settings.
 */
@Route('settings')
class SettingsPage extends HTMLElement {}

/**
 * ✗ Unable to resolve signature of class decorator when called as an expression.
 *   Argument of type 'typeof Settings' is not assignable to parameter of type 'Constructor<HTMLElement, { [key: string]: any; }>'.
 */
@Route('settings')
class Settings {}`
};

/**
 * The snippet `constructor.ts`, shown by the API reference of types.
 */
export const CONSTRUCTOR: SourceFile = {
  name: 'constructor.ts',
  lang: 'ts',
  code: `import type { Constructor } from '@xaendar/types';

/**
 * A plugin of the editor.
 */
interface Plugin {
  /**
   * Starts the plugin.
   */
  start(): void;
}

/**
 * Creates and starts a plugin of each class.
 *
 * @param types - The classes of the plugins, each with a static id.
 * @returns The plugins, by the id of their class.
 */
function startPlugins(types: ReadonlyArray<Constructor<Plugin, { id: string }>>): Map<string, Plugin> {
  const plugins = new Map<string, Plugin>();
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const plugin = new type();
    plugin.start();
    plugins.set(type.id, plugin);
  }
  return plugins;
}

/**
 * Counts the words of the document.
 */
class WordCount implements Plugin {
  /**
   * The id of the plugin.
   */
  public static readonly id = 'word-count';

  /**
   * Starts counting.
   */
  public start(): void {
    console.log('Counting words');
  }
}

/**
 * Checks the spelling of the document. It has no static id.
 */
class Spellcheck implements Plugin {
  /**
   * Starts checking.
   */
  public start(): void {
    console.log('Checking the spelling');
  }
}

startPlugins([WordCount]);  // ✓
startPlugins([Spellcheck]); // ✗ Property 'id' is missing in type 'typeof Spellcheck' but required in type '{ id: string; }'.`
};

/**
 * The snippet `contains-char.ts`, shown by the API reference of types.
 */
export const CONTAINS_CHAR: SourceFile = {
  name: 'contains-char.ts',
  lang: 'ts',
  code: `import type { ContainsChar } from '@xaendar/types';

/**
 * A class name: a literal containing a space resolves to never.
 */
type ClassName<Name extends string> = ContainsChar<Name, ' '> extends true ? never : Name;

/**
 * Adds one class to an element.
 *
 * @param element - The element.
 * @param name - The class: a literal with a space does not compile.
 */
function addClass<Name extends string>(element: Element, name: ClassName<Name>): void {
  element.classList.add(name);
}

addClass(button, 'primary');       // ✓
addClass(button, 'primary large'); // ✗ Argument of type '"primary large"' is not assignable to parameter of type 'never'.
addClass(button, className);       // ✓ a string that is not a literal is not checked`
};

/**
 * The snippet `decorator-metadata-context.ts`, shown by the API reference of types.
 */
export const DECORATOR_METADATA_CONTEXT: SourceFile = {
  name: 'decorator-metadata-context.ts',
  lang: 'ts',
  code: `import type { DecoratorMetadataContext } from '@xaendar/types';

/**
 * What the \`@Help\` decorator stores in the metadata of a class.
 */
type HelpMetadata = {
  /**
   * The description of the command.
   */
  help: string
};

/**
 * Stores the description of a command in the metadata of its class.
 *
 * @param text - The description.
 * @returns The class decorator.
 */
function Help(text: string) {
  return (_klass: unknown, context: DecoratorMetadataContext<ClassDecoratorContext, HelpMetadata>): void => {
    context.metadata.help = text;   // typed: no cast, and a number does not compile
  };
}

/**
 * A command of a command line tool.
 */
@Help('Prints the version')
class VersionCommand { }`
};

/**
 * The snippet `dictionary.ts`, shown by the API reference of types.
 */
export const DICTIONARY: SourceFile = {
  name: 'dictionary.ts',
  lang: 'ts',
  code: `import type { Dictionary } from '@xaendar/types';

/**
 * The label of the button, in the languages that have one.
 */
const labels: Dictionary<'en' | 'it' | 'fr'> = { en: 'Save', it: 'Salva' };

labels.en; // 'Save', typed string | undefined
labels.fr; // undefined: every key is optional
labels.de; // ✗ Property 'de' does not exist on type 'Dictionary<"en" | "it" | "fr">'.

/**
 * The number of visits, by page: any string is a key.
 */
const visits: Dictionary<string, number> = {};
visits['/home']; // undefined, typed number | undefined`
};

/**
 * The snippet `field-decorator.ts`, shown by the API reference of types.
 */
export const FIELD_DECORATOR: SourceFile = {
  name: 'field-decorator.ts',
  lang: 'ts',
  code: `import type { FieldDecorator } from '@xaendar/types';

/**
 * Trims the string a field is initialized with.
 */
const Trim: FieldDecorator<object, string> = () => value => value.trim();

/**
 * A greeting.
 */
class Greeting {
  /**
   * The text, without the spaces around it.
   */
  @Trim
  public text = '  Hello  ';
}

/**
 * A greeting, with its text trimmed.
 */
const greeting = new Greeting();
greeting.text;           // 'Hello'
greeting.text = '  Hi '; // a later assignment is not trimmed`
};

/**
 * The snippet `function.ts`, shown by the API reference of types.
 */
export const FUNCTION: SourceFile = {
  name: 'function.ts',
  lang: 'ts',
  code: `import type { Function } from '@xaendar/types';

/**
 * Compares two items for sorting: (first: Item, second: Item) => number
 */
type Comparator<Item> = Function<[first: Item, second: Item], number>;

/**
 * Sorts the users by name.
 */
const byName: Comparator<User> = (first, second) => first.name.localeCompare(second.name);

/**
 * The arguments of fetch, with another result: (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>
 */
type FetchJson = Function<Parameters<typeof fetch>, Promise<unknown>>;

/**
 * Fetches a resource and parses it as JSON.
 */
const fetchJson: FetchJson = async (input, init) => (await fetch(input, init)).json();`
};

/**
 * The snippet `getter-decorator.ts`, shown by the API reference of types.
 */
export const GETTER_DECORATOR: SourceFile = {
  name: 'getter-decorator.ts',
  lang: 'ts',
  code: `import type { GetterDecorator } from '@xaendar/types';

/**
 * Rounds the number a getter returns.
 */
const Rounded: GetterDecorator<object, number> = getter => function () {
  return Math.round(getter.call(this));
};

/**
 * A circle.
 */
class Circle {
  /**
   * The radius.
   */
  public radius = 2;

  /**
   * The area, rounded.
   */
  @Rounded
  public get area(): number {
    return Math.PI * this.radius ** 2;
  }
}

new Circle().area;   // 13, not 12.566…`
};

/**
 * The snippet `method-decorator.ts`, shown by the API reference of types.
 */
export const METHOD_DECORATOR: SourceFile = {
  name: 'method-decorator.ts',
  lang: 'ts',
  code: `import type { MethodDecorator } from '@xaendar/types';

/**
 * Logs every call of a method, with its arguments.
 */
const Logged: MethodDecorator<object, (...args: any[]) => unknown> = (method, context) => {
  return function (this: unknown, ...args: unknown[]): unknown {
    console.log(\`\${String(context.name)}(\${args.join(', ')})\`);
    return method.apply(this, args);
  };
};

/**
 * A shopping cart.
 */
class Cart {
  /**
   * The quantity of each product, by id.
   */
  public readonly quantities = new Map<string, number>();

  /**
   * Adds a product.
   *
   * @param id - The id of the product.
   * @param quantity - How many to add.
   */
  @Logged
  public add(id: string, quantity: number): void {
    this.quantities.set(id, (this.quantities.get(id) ?? 0) + quantity);
  }
}

new Cart().add('apple', 3); // logs add(apple, 3)`
};

/**
 * The snippet `mutable.ts`, shown by the API reference of types.
 */
export const MUTABLE: SourceFile = {
  name: 'mutable.ts',
  lang: 'ts',
  code: `import type { Mutable } from '@xaendar/types';

/**
 * The totals of a cart, read-only for the code reading them.
 */
type Totals = {
  /**
   * The number of items.
   */
  readonly items: number;
  /**
   * The price of all the items.
   */
  readonly price: number;
};

/**
 * Sums the lines of a cart.
 *
 * @param lines - The lines of the cart.
 * @returns The totals, read-only.
 */
function sum(lines: readonly CartLine[]): Totals {
  const totals: Mutable<Totals> = { items: 0, price: 0 };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    totals.items += line.quantity; // ✓ writable while it is built
    totals.price += line.quantity * line.price;
  }
  return totals;
}

sum(cart.lines).items = 0; // ✗ Cannot assign to 'items' because it is a read-only property.`
};

/**
 * The snippet `positive-integer.ts`, shown by the API reference of types.
 */
export const POSITIVE_INTEGER: SourceFile = {
  name: 'positive-integer.ts',
  lang: 'ts',
  code: `import type { PositiveInteger } from '@xaendar/types';

/**
 * Repeats a text.
 *
 * @param text - The text to repeat.
 * @param count - How many times: a literal must be an integer, zero or more.
 * @returns The text, repeated.
 */
function repeat<Count extends number>(text: string, count: PositiveInteger<Count>): string {
  return text.repeat(count);
}

repeat('ab', 3);     // 'ababab'
repeat('ab', 0);     // '': zero is accepted
repeat('ab', -1);    // ✗ Argument of type '-1' is not assignable to parameter of type 'never'.
repeat('ab', 1.5);   // ✗ Argument of type '1.5' is not assignable to parameter of type 'never'.
repeat('ab', times); // ✓ a number that is not a literal is not checked`
};

/**
 * The snippet `require-one.ts`, shown by the API reference of types.
 */
export const REQUIRE_ONE: SourceFile = {
  name: 'require-one.ts',
  lang: 'ts',
  code: `import type { RequireOne } from '@xaendar/types';

/**
 * How to find a user: by id, by email, or by both.
 */
type UserQuery = RequireOne<{
  /**
   * The id of the user.
   */
  id?: number;
  /**
   * The email of the user.
   */
  email?: string;
}>;

/**
 * Describes a query, for the log.
 *
 * @param query - The id, the email, or both.
 * @returns The description.
 */
function describeQuery(query: UserQuery): string {
  return query.id === undefined ? \`email \${query.email}\` : \`id \${query.id}\`;
}

describeQuery({ id: 42 });                             // ✓ 'id 42'
describeQuery({ email: 'ada@example.com' });           // ✓ 'email ada@example.com'
describeQuery({ id: 42, email: 'ada@example.com' });   // ✓ 'id 42'
describeQuery({});                                     // ✗ Argument of type '{}' is not assignable to parameter of type 'UserQuery'.`
};

/**
 * The snippet `tuple-of-length.ts`, shown by the API reference of types.
 */
export const TUPLE_OF_LENGTH: SourceFile = {
  name: 'tuple-of-length.ts',
  lang: 'ts',
  code: `import type { TupleOfLength } from '@xaendar/types';

/**
 * Splits a color into its red, green and blue channels.
 *
 * @param hex - The color, as #rrggbb.
 * @returns The three channels, from 0 to 255.
 */
function channels(hex: string): TupleOfLength<3> {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/**
 * The channels of the accent color, destructured: [79, 70, 229]
 */
const [red, green, blue] = channels('#4f46e5');

/**
 * A 2×2 matrix: [[number, number], [number, number]]
 */
type Matrix = TupleOfLength<2, TupleOfLength<2>>;`
};
