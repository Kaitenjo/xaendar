/**
 * Configuration object accepted by the `@Directive` decorator.
 */
export type DirectiveOptions = {
  /**
   * The selector that identifies the elements the directive is applied to.
   */
  selector: string;
  /**
   * Makes the components declaring the directive among their `hostDirectives` form-associated, as the static
   * `formAssociated` of the custom elements does: controls of the forms holding them, which the browser calls the form
   * callbacks of (`formResetCallback`, `formDisabledCallback`…), forwarded to the directive. For a directive giving the
   * form the value of its component, such as `FormControlDirective` of `@xaendar/directives`. Defaults to `false`.
   */
  formAssociated?: boolean;
};
