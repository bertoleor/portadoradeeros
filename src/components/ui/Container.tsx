'use client';

import { forwardRef } from 'react';

import type { HTMLAttributes} from 'react';

type ContainerSize = 'sm' | 'md' | 'lg' | 'full';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

const sizeStyles: Record<ContainerSize, string> = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  full: 'max-w-full',
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          mx-auto 
          px-4 sm:px-6 md:px-8 lg:px-[10%]
          w-full
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
