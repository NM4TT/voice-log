import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { assertNever } from '@/domain/types';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly children: ReactNode;
}

function getVariantClasses(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return 'bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-hover)] border border-transparent';
    case 'secondary':
      return 'bg-[var(--color-secondary-base)] text-white hover:bg-[var(--color-secondary-hover)] border border-transparent';
    case 'ghost':
      return 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] border border-[var(--color-surface-border)]';
    case 'danger':
      return 'bg-[var(--color-danger-light)] text-[var(--color-danger-base)] hover:bg-[var(--color-danger-base)] hover:text-white border border-transparent';
    default:
      return assertNever(variant);
  }
}

function getSizeClasses(size: ButtonSize): string {
  switch (size) {
    case 'sm':
      return 'px-2.5 py-1.5 text-xs rounded-md gap-1.5';
    case 'md':
      return 'px-3.5 py-2 text-sm rounded-lg gap-2';
    case 'lg':
      return 'px-5 py-2.5 text-base rounded-lg gap-2.5';
    default:
      return assertNever(size);
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
