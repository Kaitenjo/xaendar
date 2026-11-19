import { render } from '@builder.io/qwik';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import { App } from './app';

/*
  The element is defined before Qwik renders: Qwik creates <ex-qty-picker> itself, and a tag that is not
  defined yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  const root = document.getElementById('root');
  if (root) {
    render(root, <App />);
  }
});
