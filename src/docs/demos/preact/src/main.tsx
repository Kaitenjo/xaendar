import { render } from 'preact';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import { App } from './App';

/*
  The element is defined before Preact renders: Preact creates <ex-qty-picker> itself, and a tag that is not
  defined yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  const root = document.getElementById('root');
  if (root) {
    render(<App />, root);
  }
});
