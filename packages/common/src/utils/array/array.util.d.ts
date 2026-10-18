declare global {
    interface Array<T> {
        removeItem(item: T): boolean;
    }
}
export {};
