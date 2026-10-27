import { createApp } from 'vue';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import App from './App.vue';

/*
  The element is defined before Vue renders: Vue creates <ex-qty-picker> itself, and a tag that is not defined
  yet stays an empty unknown element until its definition arrives.
*/
defineQtyPicker().then(() => {
  createApp(App).mount('#root');
});
