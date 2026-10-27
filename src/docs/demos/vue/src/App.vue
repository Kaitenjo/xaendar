<script setup lang="ts">
  import { ref } from 'vue';

  /*
    Vue sets a DOM property whenever the element has one, so `:value` writes the input of the element, and
    `@changed` listens to its event on the element itself, since it does not bubble.
  */
  const quantity = ref(0);

  const read = (event: Event) => {
    quantity.value = (event as CustomEvent<number>).detail;
  };
</script>

<template>
  <div class="panel">
    <ex-qty-picker :value="quantity" @changed="read"></ex-qty-picker>
    <p>Vue state: <strong>{{ quantity }}</strong></p>
    <button type="button" @click="quantity += 5">+5 from Vue</button>
  </div>
</template>
