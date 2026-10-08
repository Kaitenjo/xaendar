public afterRender(): void {
  // ✗ created after the connection: null until the element is connected again
  this.late = query(this, 'input');
}

// At the next disconnection the query throws:
// TypeError: stop is not a function
