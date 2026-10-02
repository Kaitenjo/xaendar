declare global {
  interface Array<T> {
    removeItem(item: T): boolean;
  }
}

Object.defineProperty(Array.prototype, 'removeItem', {
  value: function <T>(this: T[], item: T): boolean {
    const index = this.indexOf(item);
    if (index === -1) {
      return false;
    }
    this.splice(index, 1);
    return true;
  },
  enumerable: false,
  configurable: false,
  writable: false,
});

export {};