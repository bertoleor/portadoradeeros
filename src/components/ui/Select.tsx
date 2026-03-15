'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly label?: string;
  readonly id?: string;
  readonly className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  id,
  className = ''
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 mb-2"
        >
          {label}
        </label>
      )}
      
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-white border border-black/10 rounded-2xl
          text-left text-sm transition-all duration-200
          hover:border-black/20 hover:bg-gray-50/50
          focus:outline-none focus:border-black/30 focus:ring-0
          ${selectedOption ? 'text-black' : 'text-black/40'}
        `}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-black/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-50 w-full mt-2 py-1 
              bg-white border border-black/10 rounded-2xl 
              shadow-lg shadow-black/10
              without-ring
            "
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="
                  w-full flex items-center justify-between px-4 py-3
                  text-sm text-left transition-colors
                  hover:bg-gray-50
                  without-ring
                "
              >
                <span className={option.value === value ? 'font-medium' : ''}>
                  {option.label}
                </span>
                {option.value === value && (
                  <Check size={14} className="text-black" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
