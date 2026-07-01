if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, "toReversed", {
    value: function toReversed<T>(this: T[]) {
      return this.slice().reverse();
    },
    writable: true,
    configurable: true,
  });
}
