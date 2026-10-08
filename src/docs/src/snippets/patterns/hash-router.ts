// router.ts — the same router, reading the path from the URL: links work, and so do back and forward
import { computed, signal } from '@xaendar/core/signals';

const hash = signal(location.hash);
window.addEventListener('hashchange', () => hash.set(location.hash));

// '#/users/2' → '/users/2'
export const path = computed(() => hash().slice(1) || '/');

export function navigate(target: string): void {
  location.hash = target; // hashchange updates the signal
}

// Links need no click handler: <a href="#/users/2">…</a>
