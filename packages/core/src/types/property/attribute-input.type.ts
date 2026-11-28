/**
 * An input written by an attribute of the element of its component, declared by `attribute` of `@Property`.
 */
export type AttributeInput = {
  /**
   * The name of the property of the input.
   */
  readonly property: string,
  /**
   * Converts the text of the attribute into the value the input takes: the one deduced from the default value
   * (`toBooleanInput`, `toNumberInput`, `toStringInput`), or the function `attribute` gives.
   */
  readonly convert: (value: string) => unknown,
  /**
   * Whether the input is reflected on the same attribute too (`reflect`): a change of the attribute matching the
   * reflection of the value of the input comes from the reflection, and leaves the input as it is.
   */
  readonly reflects: boolean
};
