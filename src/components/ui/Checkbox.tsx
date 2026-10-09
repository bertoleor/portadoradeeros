import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input type="checkbox" className="peer sr-only" ref={ref} {...props} />
          <div
            className={cn(
              'w-5 h-5 rounded-lg border border-white/20 bg-white/5 transition-all duration-300',
              'group-hover:border-white/40',
              'peer-checked:bg-white peer-checked:border-white',
              className
            )}
          />
          <Check
            size={12}
            className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity duration-300"
            strokeWidth={3}
          />
        </div>
        {label && (
          <span className="text-[11px] md:text-xs text-white/50 leading-relaxed font-light group-hover:text-white/70 transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
