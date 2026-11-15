/**
 * The function `onLeave` registers on an element, called when the runtime is about to remove it: the element stays in
 * the DOM until the promise it returns settles, at most `LEAVE_TIMEOUT` milliseconds, or is removed at once when it
 * returns no promise.
 *
 * @param element - The element leaving.
 * @returns A promise settling once the element can be removed, nothing to remove it at once.
 */
export type LeaveHandler = (element: Element) => Promise<void> | void;
