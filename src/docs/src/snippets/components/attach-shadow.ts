// CustomElement has already attached an open shadow root in its constructor
this.attachShadow({ mode: 'closed' });
// ✗ NotSupportedError: Failed to execute 'attachShadow' on 'Element':
//   Shadow root cannot be created on a host which already hosts a shadow tree.
