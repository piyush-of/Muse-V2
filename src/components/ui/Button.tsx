import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            // Default: premium dark plum background in light mode, soft violet in dark mode
            'bg-accent text-accent-foreground shadow hover:bg-accent/95 hover:shadow-md': variant === 'default',
            // Outline: clean borders
            'border border-border-strong bg-transparent text-foreground hover:bg-card hover:border-foreground/30': variant === 'outline',
            // Ghost: low-profile
            'bg-transparent text-foreground hover:bg-card': variant === 'ghost',
            // Link
            'text-accent underline-offset-4 hover:underline bg-transparent p-0 h-auto font-sans normal-case tracking-normal': variant === 'link',
          },
          {
            'px-3 py-1.5 text-[10px]': size === 'sm',
            'px-5 py-2.5': size === 'md',
            'px-6 py-3.5 text-sm': size === 'lg',
          }
        ),
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-3 w-3 animate-spin text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
