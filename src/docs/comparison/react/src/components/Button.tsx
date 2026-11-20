import type { ReactNode } from 'react';

/**
 * The button of the page.
 */
export function Button({ variant = 'secondary', onClick, children }: { variant?: 'primary' | 'secondary'; onClick: () => void; children: ReactNode }) {
  return <button className={`ui-button ui-button--${variant}`} type="button" onClick={onClick}>{children}</button>;
}
