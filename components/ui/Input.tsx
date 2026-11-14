import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-content-primary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'h-9 w-full bg-surface border border-border rounded px-3 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-content-primary focus:ring-1 focus:ring-brand transition-all disabled:opacity-50 disabled:bg-canvas',
            error && 'border-status-error focus:ring-status-error',
            className
          )}
          {...props}
        />
        {helperText && !error && <p className="text-[11px] text-content-secondary">{helperText}</p>}
        {error && <p className="text-[11px] text-status-error font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
