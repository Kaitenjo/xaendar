import type { IfBindingNode } from './if-binding-node.type';
import type { SwitchBindingNode } from './switch-binding-node.type';

/**
 * AST node representing a conditional binding, i.e. a list of mutually exclusive branches whose bindings
 * are applied only while the branch is the selected one. It is declared either as an `@if` chain,
 * e.g. `@if (condition) { name="value" } @else { (event)="handler()" }`, or as a `@switch`,
 * e.g. `@switch (expression) { @case ('a') { name="value" } @default { @@directive } }`.
 *
 * A conditional binding is declared either on an element, where its branches bind the attributes and events of the
 * element and apply directives to it, or inside a directive, where they bind the properties and events of
 * that directive.
 */
export type ConditionalBindingNode = IfBindingNode | SwitchBindingNode;
