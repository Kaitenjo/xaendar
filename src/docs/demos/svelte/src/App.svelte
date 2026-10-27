<script lang="ts">
  import type { QtyPicker } from '@xaendar-demo/qty-picker';

  /*
    Svelte sets a DOM property whenever the element has one, so the quantity is never bound onto the tag: it
    goes in through the public method of the element, and comes back out through its `changed` event, which
    does not bubble and is therefore listened to on the element itself.
  */
  let picker: QtyPicker | undefined = $state();
  let quantity = $state(0);

  $effect(() => {
    const element = picker;
    if (!element) {
      return;
    }

    const read = (event: Event) => {
      quantity = (event as CustomEvent<number>).detail;
    };

    element.addEventListener('changed', read);
    return () => element.removeEventListener('changed', read);
  });

  $effect(() => picker?.setValue(quantity));
</script>

<div class="panel">
  <ex-qty-picker bind:this={picker}></ex-qty-picker>
  <p>Svelte state: <strong>{quantity}</strong></p>
  <button type="button" onclick={() => (quantity += 5)}>+5 from Svelte</button>
</div>
