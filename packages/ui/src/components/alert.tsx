import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@platform/utils';

const alertVariants = cva('rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

/** Error/info state surface. */
export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {title ? <div className="mb-1 font-medium">{title}</div> : null}
      {children}
    </div>
  );
}
