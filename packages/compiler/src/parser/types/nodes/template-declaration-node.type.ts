import type { ElementRefNode } from './element-ref-node.type';

/**
 * The name a `<template>` declares, e.g. `row` in `<template row(item: Item)>`: it names the template, which `@render`
 * calls, in its scope. Like an element ref, it has a name and the span of the name.
 */
export type TemplateDeclarationNode = Pick<ElementRefNode, 'name' | 'nameSpan'>;
