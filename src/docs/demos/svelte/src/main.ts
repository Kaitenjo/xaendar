import { mount } from 'svelte';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import App from './App.svelte';

/*
  The element is defined before Svelte renders: Svelte creates <ex-qty-picker> itself, and a tag that is not
  defined yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  const root = document.getElementById('root');
  if (root) {
    mount(App, { target: root });
  }
});
