import type { ReactNode } from 'react';

export interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-surface-card)] border border-[var(--color-surface-border)] rounded-xl shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
