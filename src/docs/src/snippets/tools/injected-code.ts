// What the plugin adds to user-card.xd.component.ts, after Babel has compiled the decorators (simplified)
import { _defineRender } from '@xaendar/core';
import { render as __UserCardComponent_render } from 'virtual:xaendar-template:/src/user-card/user-card.xd.component.html?signals=name&lang.js';
import { sheet as __UserCardComponent_sheet } from 'virtual:xaendar-style?path=%2Fsrc%2Fuser-card%2Fuser-card.xd.component.css&lang.js';

/**
 * The component, as written by you.
 */
class UserCardComponent extends CustomElement {
  static {
    // Runs before the decorators: @WebComponent finds the render function and the stylesheet ready
    _defineRender(this, __UserCardComponent_render, __UserCardComponent_sheet);
  }
}
