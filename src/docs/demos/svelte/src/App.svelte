<script lang="ts">
  /*
    Svelte sets a DOM property whenever the element defines one, so `value` writes the input of the element, and
    `onchanged` listens to its event on the element itself, since it does not bubble.
  */
  let quantity = $state(0);

  const read = (event: Event) => {
    quantity = (event as CustomEvent<number>).detail;
  };
</script>

<div class="panel">
  <ex-qty-picker value={quantity} onchanged={read}></ex-qty-picker>
  <p>Svelte state: <strong>{quantity}</strong></p>
  <button type="button" onclick={() => (quantity += 5)}>+5 from Svelte</button>
</div>
