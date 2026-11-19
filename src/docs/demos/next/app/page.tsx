'use client';

import { QtyPanel } from './qty-panel';
import type { ReactElement } from 'react';

/*
  The whole page is a client component. The Xaendar element has no server side — its class extends HTMLElement
  at the top level of its module, so Node cannot even load it — and the static export of this page must not
  try to render it: the panel below renders its tag only from an effect, which runs in the browser only.

  `next/dynamic` with `ssr: false` is the other Next.js way to say the same thing, and it works in a browser
  too; it is not used because it puts the panel in a chunk fetched at run time, and the headless check of this
  demo (src/docs/demos/verify.mjs) cannot load one: its DOM fetches an injected <script> synchronously, from
  the very process that serves it. Everything this page needs therefore ships in the chunks index.html names.
*/

/**
 * The exported page.
 *
 * @returns The panel of the demo.
 */
export default function Page(): ReactElement {
  return <QtyPanel />;
}
