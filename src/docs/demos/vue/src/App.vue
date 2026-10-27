<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import type { QtyPicker } from '@xaendar-demo/qty-picker';

  /*
    Vue sets a DOM property whenever the element has one, so the quantity is never bound onto the tag: it goes
    in through the public method of the element, and comes back out through its `changed` event, which does not
    bubble and is therefore listened to on the element itself.
  */
  const picker = ref<QtyPicker | null>(null);
  const quantity = ref(0);

  const read = (event: Event) => {
    quantity.value = (event as CustomEvent<number>).detail;
  };

  onMounted(() => picker.value?.addEventListener('changed', read));
  onUnmounted(() => picker.value?.removeEventListener('changed', read));
  watch(quantity, value => picker.value?.setValue(value));
</script>

<template>
  <div class="panel">
    <ex-qty-picker ref="picker"></ex-qty-picker>
    <p>Vue state: <strong>{{ quantity }}</strong></p>
    <button type="button" @click="quantity += 5">+5 from Vue</button>
  </div>
</template>
