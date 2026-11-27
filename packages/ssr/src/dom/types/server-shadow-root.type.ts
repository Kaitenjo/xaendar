import type { ServerHTMLElement } from '../server-html-element/server-html-element';

/**
 * The shadow root a component of the server DOM attaches: the server renders its content as a declarative shadow root.
 */
export type ServerShadowRoot = {
  /**
   * The element the shadow root is attached to.
   */
  readonly host: ServerHTMLElement;
  /**
   * The mode of the shadow root.
   */
  readonly mode: ShadowRootMode;
  /**
   * Whether the shadow root delegates the focus of its host to its first focusable element.
   */
  readonly delegatesFocus: boolean;
  /**
   * How the slots of the shadow root get their nodes: by name, or assigned by the code (`slot.assign()`).
   */
  readonly slotAssignment: SlotAssignmentMode;
  /**
   * Whether `getHTML()` writes the shadow root when asked for the serializable ones.
   */
  readonly serializable: boolean;
  /**
   * Whether `cloneNode()` of the host clones the shadow root.
   */
  readonly clonable: boolean;
  /**
   * The stylesheets adopted by the shadow root, which the server never reads.
   */
  adoptedStyleSheets: unknown[];
};
