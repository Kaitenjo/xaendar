import { memo, type ReactNode } from 'react';

/**
 * The button of the page, rendered again only when its props change (`memo`).
 */
export const Button = memo(function Button({ variant = 'secondary', onClick, children }: { variant?: 'primary' | 'secondary'; onClick: () => void; children: ReactNode }) {
  return <button className={`ui-button ui-button--${variant}`} type="button" onClick={onClick}>{children}</button>;
});
