/**
 * An attribute or a property of a component or directive, `name` or `name="value"`.
 */
export type LayoutAttribute = {
  /**
   * Discriminant identifying the item as an attribute.
   */
  readonly kind: 'attribute';
  /**
   * The name of the attribute.
   */
  readonly name: string;
  /**
   * The value as written between the quotes, `undefined` for an attribute declared without one.
   */
  readonly value?: string;
};

/**
 * An event binding, `(name)="handler($event)"`.
 */
export type LayoutEvent = {
  /**
   * Discriminant identifying the item as an event.
   */
  readonly kind: 'event';
  /**
   * The name of the event.
   */
  readonly name: string;
  /**
   * The handler as written between the quotes.
   */
  readonly value: string;
};

/**
 * A directive or a structural directive applied to an element, `@@name<Type>(bindings)` or `*name(bindings)`.
 */
export type LayoutDirective = {
  /**
   * Discriminant identifying the item as a directive.
   */
  readonly kind: 'directive';
  /**
   * What the selector is written after: `@@` for a directive, `*` for a structural one.
   */
  readonly prefix: '@@' | '*';
  /**
   * The selector of the directive.
   */
  readonly name: string;
  /**
   * The type arguments as written between the angle brackets, `undefined` if the directive declares none.
   */
  readonly typeArguments?: string;
  /**
   * The bindings written between the parentheses, `undefined` if the directive has none.
   */
  readonly items?: LayoutItem[];
};

/**
 * A branch of a block: `@if (condition) { body }`, `@else { body }`, `@case (condition) { body }`.
 */
export type LayoutBranch<Body> = {
  /**
   * The keyword after the `@`: `if`, `else if`, `else`, `for`, `case` or `default`.
   */
  readonly keyword: string;
  /**
   * The condition as written between the parentheses, `undefined` for a branch without one.
   */
  readonly condition?: string;
  /**
   * The content between the braces, `undefined` for a `@case` stacked on the next one.
   */
  readonly body?: Body;
};

/**
 * A control-flow block: an `@if` with its `@else if` and `@else` branches, a `@for`, or a `@switch` with its cases.
 */
export type LayoutBlock<Body> = {
  /**
   * Discriminant identifying the node as a block.
   */
  readonly kind: 'block';
  /**
   * The keyword opening the block: `if`, `for` or `switch`.
   */
  readonly keyword: 'if' | 'for' | 'switch';
  /**
   * The expression a `@switch` is on, `undefined` for the other blocks.
   */
  readonly expression?: string;
  /**
   * The branches of the block, the first one included: the cases of a `@switch`.
   */
  readonly branches: LayoutBranch<Body>[];
};

/**
 * A conditional binding of an opening tag or of a directive: a block whose bodies are items.
 */
export type LayoutConditionalBinding = LayoutBlock<LayoutItem[]>;

/**
 * What an opening tag or the parentheses of a directive hold.
 */
export type LayoutItem = LayoutAttribute | LayoutEvent | LayoutDirective | LayoutConditionalBinding;

/**
 * An element, with the content between its tags as written.
 */
export type LayoutElement = {
  /**
   * Discriminant identifying the node as an element.
   */
  readonly kind: 'element';
  /**
   * The tag name.
   */
  readonly name: string;
  /**
   * The type arguments written between the parentheses after the tag name, `undefined` if the element declares none.
   */
  readonly typeArguments?: string;
  /**
   * The items of the opening tag.
   */
  readonly items: LayoutItem[];
  /**
   * Whether the element is written `<name ... />`: it has no content nor closing tag.
   */
  readonly selfClosing: boolean;
  /**
   * The children, `undefined` for an element without content (self-closing or void) or whose content is kept as written.
   */
  readonly children?: LayoutAtom[];
  /**
   * The content between the tags kept as written (`<pre>`, `<textarea>`, `<script>`, `<style>`), `undefined` otherwise.
   */
  readonly raw?: string;
};

/**
 * A piece of the content of an element or block, in the order it is written in.
 */
export type LayoutAtom =
  | {
    /**
     * Discriminant identifying the atom as text.
     */
    readonly kind: 'text';
    /**
     * The text as written, the spaces and line breaks around it included.
     */
    readonly value: string;
  }
  | {
    /**
     * Discriminant identifying the atom as an interpolation.
     */
    readonly kind: 'interpolation';
    /**
     * The expression as written between the braces.
     */
    readonly expression: string;
  }
  | {
    /**
     * Discriminant identifying the atom as a comment.
     */
    readonly kind: 'comment';
    /**
     * The whole comment, `<!--` and `-->` included.
     */
    readonly value: string;
  }
  | LayoutElement
  | LayoutBlock<LayoutAtom[]>;
