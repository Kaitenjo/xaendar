import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import { LitApp } from './lit-app';

/*
  The element is defined before Lit renders: Lit creates <ex-qty-picker> itself, and a tag that is not defined
  yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  customElements.define('lit-app', LitApp);
  const root = document.getElementById('root');
  if (root) {
    root.appendChild(document.createElement('lit-app'));
  }
});
