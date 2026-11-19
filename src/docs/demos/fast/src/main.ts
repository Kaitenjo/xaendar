import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import { defineFastApp } from './fast-app';

/*
  The element is defined before FAST renders: FAST creates <ex-qty-picker> itself, and a tag that is not
  defined yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  defineFastApp();
  const root = document.getElementById('root');
  if (root) {
    root.appendChild(document.createElement('fast-app'));
  }
});
