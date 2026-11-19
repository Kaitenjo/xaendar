import type { ComponentMetadata } from '@xaendar/compiler';

/**
 * A place where a template renders a component, as the analysis of the static components reads it.
 */
export type ComponentUsage = {
  /**
   * The component.
   */
  readonly component: ComponentMetadata;
  /**
   * Whether the browser may have to create it: it is in a block depending on a signal, in a `<template>` or in a `@client`.
   */
  readonly dynamic: boolean;
  /**
   * Whether it is in a `@placeholder`, which the browser removes without running its code.
   */
  readonly placeholder: boolean;
  /**
   * Whether an input of the component depends on a signal.
   */
  readonly reactiveInputs: boolean;
  /**
   * The names the inputs bound to an expression are written with: their values reach the browser only serialized, when
   * the template is a static one.
   */
  readonly expressionInputs: readonly string[];
};
