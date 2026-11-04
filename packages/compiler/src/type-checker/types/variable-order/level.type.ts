import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';

/**
 * A part of the template whose nodes are rendered together: the template itself, or the content of a template
 * (`<template name(…)>`), rendered by each `@render` calling it.
 */
export type Level = TemplateNode | null;
