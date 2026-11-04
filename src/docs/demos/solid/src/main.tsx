import { render } from 'solid-js/web';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import { App } from './App';

/*
  The element is defined before Solid renders: Solid creates <ex-qty-picker> itself, and a tag that is not
  defined yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  const root = document.getElementById('root');
  if (root) {
    render(() => <App />, root);
  }
});
