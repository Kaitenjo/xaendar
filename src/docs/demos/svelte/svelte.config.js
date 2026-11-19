import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/*
  The only preprocessing the demo needs is the one that strips the types of its <script lang="ts"> blocks.
*/
export default {
  preprocess: vitePreprocess()
};
