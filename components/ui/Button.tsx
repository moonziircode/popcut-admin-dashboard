import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-brand text-brand-contrast font-semibold hover:bg-brand-hover focus:ring-brand shadow-sm active:scale-[0.98]',
      secondary:
        'bg-surface text-content-primary border border-border hover:bg-canvas focus:ring-border-strong active:scale-[0.98]',
      outline:
        'bg-transparent text-content-primary border border-border hover:bg-canvas focus:ring-border-strong',
      destructive:
        'bg-surface text-status-error border border-status-error hover:bg-status-error-bg focus:ring-status-error',
      ghost:
        'bg-transparent text-content-secondary hover:text-content-primary hover:bg-canvas focus:ring-border',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-xs gap-2',
      lg: 'h-10 px-4 text-sm gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
