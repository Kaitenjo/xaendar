import type { LayoutAttribute } from './layout-attribute.type';
import type { LayoutEvent } from './layout-event.type';
import type { LayoutElementRef } from './layout-element-ref.type';
import type { LayoutTemplateDeclaration } from './layout-template-declaration.type';
import type { LayoutDirective } from './layout-directive.type';
import type { LayoutConditionalBinding } from './layout-conditional-binding.type';

/**
 * What an opening tag or the parentheses of a directive hold.
 */
export type LayoutItem = LayoutElementRef | LayoutTemplateDeclaration | LayoutAttribute | LayoutEvent | LayoutDirective | LayoutConditionalBinding;
