'use client';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full text-base transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium',
  {
    variants: {
      variant: {
        default: [
          'min-h-[3.5rem] rounded-2xl border border-gray-200',
          'bg-gray-50/50 hover:bg-gray-50/80',
          'px-5 py-2 shadow-sm ring-offset-background',
          'placeholder:text-gray-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
        ],
        underline: [
          'rounded-none border-0 border-b border-[rgba(15,15,20,0.14)]',
          'bg-transparent px-0 py-3 h-auto shadow-none',
          'text-[15px] text-[rgba(15,15,20,0.88)]',
          'placeholder:text-[rgba(15,15,20,0.55)]',
          'focus-visible:outline-none focus-visible:border-[rgba(15,15,20,0.45)]',
          'ring-0 ring-offset-0',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface InputProps
  extends React.ComponentPropsWithoutRef<'input'>, VariantProps<typeof inputVariants> {}

function Input({ className, type, variant, ...props }: Readonly<InputProps>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
