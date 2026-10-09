/**
 * ✗ Creates the query after the connection: it is null until the element is connected again.
 */
public afterRender(): void {
  this.late = query(this, 'input');
}

// At the next disconnection the query throws:
// TypeError: stop is not a function
