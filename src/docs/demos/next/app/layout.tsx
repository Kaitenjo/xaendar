import './demo.css';
import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

/**
 * The metadata of the exported page.
 */
export const metadata: Metadata = {
  title: 'Xaendar in Next.js'
};

/**
 * The only layout of the demo: it carries the stylesheet shared by every application of this page.
 *
 * @param props - The properties of the layout.
 * @param props.children - The page to render.
 * @returns The document of the application.
 */
export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
